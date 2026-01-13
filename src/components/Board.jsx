import { useEffect, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import { subscribeToColumns, subscribeToCards, updateCardsOrder, addColumn, updateColumn, deleteColumn } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const Board = () => {
  const { user, loading } = useAuth();
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [columnsInitialized, setColumnsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    // 컬럼 구독
    const unsubscribeColumns = subscribeToColumns(
      (newColumns) => {
        setColumns(newColumns);
        setError(null);
        
        // 컬럼이 없고 아직 초기화되지 않았으면 기본 컬럼 생성
        if (newColumns.length === 0 && !columnsInitialized && !loading && user) {
          setColumnsInitialized(true);
          const defaultColumns = [
            { title: '할 일', order: 0 },
            { title: '진행 중', order: 1 },
            { title: '완료', order: 2 },
          ];

          defaultColumns.forEach((col) => {
            addColumn(col).catch((error) => {
              console.error('컬럼 생성 실패:', error);
              setError('컬럼 생성에 실패했습니다. Firebase 설정을 확인해주세요.');
            });
          });
        }
      },
      (error) => {
        console.error('컬럼 구독 오류:', error);
        setError('Firebase 연결에 실패했습니다. 설정을 확인해주세요.');
      }
    );

    // 카드 구독
    const unsubscribeCards = subscribeToCards(
      (newCards) => {
        setCards(newCards);
      },
      (error) => {
        console.error('카드 구독 오류:', error);
      }
    );

    return () => {
      unsubscribeColumns();
      unsubscribeCards();
    };
  }, [columnsInitialized, loading, user]);

  // 컬럼별로 카드 분류
  const getCardsByColumn = (columnId) => {
    return cards
      .filter((card) => card.columnId === columnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // 새 컬럼 추가
  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) {
      alert('컬럼 제목을 입력해주세요.');
      return;
    }

    try {
      const newOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order || 0)) + 1 : 0;
      await addColumn({ title: newColumnTitle.trim(), order: newOrder });
      setNewColumnTitle('');
      setShowAddColumnForm(false);
    } catch (error) {
      console.error('컬럼 추가 실패:', error);
      alert('컬럼 추가에 실패했습니다.');
    }
  };

  // 컬럼 이름 변경
  const handleUpdateColumn = async (columnId, updates) => {
    try {
      await updateColumn(columnId, updates);
    } catch (error) {
      console.error('컬럼 업데이트 실패:', error);
      alert('컬럼 이름 변경에 실패했습니다.');
    }
  };

  // 컬럼 삭제
  const handleDeleteColumn = async (columnId) => {
    try {
      // 해당 컬럼의 모든 카드도 함께 삭제
      const columnCards = getCardsByColumn(columnId);
      // 카드는 나중에 자동으로 정리되거나 별도로 삭제할 수 있음
      await deleteColumn(columnId);
    } catch (error) {
      console.error('컬럼 삭제 실패:', error);
      alert('컬럼 삭제에 실패했습니다.');
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // 드롭 위치가 없으면 무시
    if (!destination) return;

    // 같은 위치면 무시
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    const sourceCards = getCardsByColumn(sourceColumnId);
    const destCards = getCardsByColumn(destColumnId);
    const draggedCard = cards.find((card) => card.id === draggableId);

    if (!draggedCard) return;

    let updates = [];

    // 같은 컬럼 내에서 이동
    if (sourceColumnId === destColumnId) {
      const newCards = Array.from(sourceCards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      // 순서 업데이트
      newCards.forEach((card, index) => {
        if (card.id !== draggedCard.id) {
          updates.push({
            cardId: card.id,
            updates: { order: index },
          });
        }
      });
      updates.push({
        cardId: draggedCard.id,
        updates: { order: destination.index },
      });
    } else {
      // 다른 컬럼으로 이동
      const newSourceCards = Array.from(sourceCards);
      newSourceCards.splice(source.index, 1);

      const newDestCards = Array.from(destCards);
      newDestCards.splice(destination.index, 0, draggedCard);

      // 소스 컬럼의 카드들 순서 업데이트
      newSourceCards.forEach((card, index) => {
        updates.push({
          cardId: card.id,
          updates: { order: index },
        });
      });

      // 대상 컬럼의 카드들 순서 업데이트
      newDestCards.forEach((card, index) => {
        updates.push({
          cardId: card.id,
          updates: { order: index, columnId: destColumnId },
        });
      });
    }

    // Firestore에 일괄 업데이트
    try {
      await updateCardsOrder(updates);
    } catch (error) {
      console.error('카드 순서 업데이트 실패:', error);
      alert('카드 이동에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-full px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">패들렛 보드</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="w-full overflow-x-auto overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="inline-flex px-6 py-6 gap-5" style={{ alignItems: 'flex-start' }}>
            {/* 기존 컬럼들 */}
            {columns.map((column) => {
              const columnCards = getCardsByColumn(column.id);
              return (
                <Column 
                  key={column.id} 
                  column={column} 
                  cards={columnCards}
                  onUpdateColumn={handleUpdateColumn}
                  onDeleteColumn={handleDeleteColumn}
                />
              );
            })}

            {/* 새 컬럼 추가 버튼/폼 */}
            <div className="flex-shrink-0 w-[320px] flex flex-col">
              {!showAddColumnForm ? (
                <button
                  onClick={() => setShowAddColumnForm(true)}
                  className="w-full h-16 bg-white/90 hover:bg-white rounded-xl shadow-sm border-2 border-dashed border-white/50 hover:border-blue-400 transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-blue-600 font-medium"
                >
                  <span className="mr-2 text-xl">+</span>
                  섹션 추가
                </button>
              ) : (
                <form onSubmit={handleAddColumn} className="bg-white/95 rounded-xl shadow-lg p-4 border border-white/50">
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="섹션 제목 입력..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddColumnForm(false);
                        setNewColumnTitle('');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-sm transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 shadow-lg max-w-md z-50">
          <p className="font-semibold">⚠️ 오류 발생</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Board;
