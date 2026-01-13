import { useEffect, useState, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Column from './Column';
import { subscribeToColumns, subscribeToCards, updateCardsOrder, updateColumnsOrder, addColumn, updateColumn, deleteColumn } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { APP_VERSION, APP_TITLE } from '../config/version';

const Board = () => {
  const { user, loading } = useAuth();
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [columnsInitialized, setColumnsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [showAddColumnForm, setShowAddColumnForm] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const ignoreUpdatesUntilRef = useRef(0); // Firestore 업데이트 후 일정 시간 동안 실시간 업데이트 무시
  const isDraggingRef = useRef(false); // 드래그 중인지 추적 (리렌더링 없이)

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
        const now = Date.now();
        // 드래그 중이거나 최근에 업데이트한 경우 무시 (성능 최적화)
        // ref를 사용하여 최신 드래그 상태 확인
        if (isDraggingRef.current || now < ignoreUpdatesUntilRef.current) {
          return;
        }
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
  }, [columnsInitialized, loading, user]); // isDragging 의존성 제거 (구독 재설정 방지)

  // 컬럼별로 카드 분류 (메모이제이션으로 성능 최적화)
  // cards 배열의 참조가 변경될 때마다 재계산되도록 보장
  const cardsByColumn = useMemo(() => {
    const grouped = {};
    cards.forEach((card) => {
      const colId = card.columnId;
      if (!grouped[colId]) {
        grouped[colId] = [];
      }
      grouped[colId].push(card);
    });
    // 각 컬럼별로 정렬 (새 배열 반환하여 불변성 보장)
    const sortedGrouped = {};
    Object.keys(grouped).forEach((colId) => {
      sortedGrouped[colId] = [...grouped[colId]].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return sortedGrouped;
  }, [cards]);

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
      const columnCards = (cardsByColumn[columnId] || []);
      // 카드는 나중에 자동으로 정리되거나 별도로 삭제할 수 있음
      await deleteColumn(columnId);
    } catch (error) {
      console.error('컬럼 삭제 실패:', error);
      alert('컬럼 삭제에 실패했습니다.');
    }
  };

  // 드래그 시작 핸들러 - 상태 업데이트 없이 ref만 업데이트 (리렌더링 방지)
  const handleDragStart = () => {
    isDraggingRef.current = true; // ref만 업데이트 (리렌더링 없음)
  };

  // 드래그 앤 드롭 핸들러 (최적화: 즉시 로컬 업데이트 + 백그라운드 Firestore 업데이트)
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    // 드롭 위치가 없으면 무시
    if (!destination) {
      isDraggingRef.current = false;
      return;
    }

    // 같은 위치면 무시
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      isDraggingRef.current = false;
      return;
    }

    // 섹션(컬럼) 드래그 처리
    if (type === 'COLUMN') {
      const sortedColumns = [...columns].sort((a, b) => (a.order || 0) - (b.order || 0));
      const [removed] = sortedColumns.splice(source.index, 1);
      sortedColumns.splice(destination.index, 0, removed);

      // 순서 업데이트
      const updates = sortedColumns.map((col, index) => ({
        columnId: col.id,
        updates: { order: index },
      }));

      // 즉시 로컬 상태 반영
      setColumns(sortedColumns);

      // Firestore에 일괄 업데이트 (백그라운드)
      updateColumnsOrder(updates)
        .catch((error) => {
          console.error('컬럼 순서 업데이트 실패:', error);
        });

      isDraggingRef.current = false;
      return;
    }

    // 카드 드래그 처리
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    const sourceCards = cards
      .filter((card) => card.columnId === sourceColumnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const destCards = cards
      .filter((card) => card.columnId === destColumnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const draggedCard = cards.find((card) => card.id === draggableId);

    if (!draggedCard) {
      isDraggingRef.current = false;
      return;
    }

    // 낙관적 업데이트: 즉시 UI 반영을 위한 카드 배열 생성 (불변성 보장)
    let updates = [];
    let updatedCards;

    // 같은 컬럼 내에서 이동
    if (sourceColumnId === destColumnId) {
      const newCards = Array.from(sourceCards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);

      // 불변성 보장: map을 사용하여 새로운 배열과 객체 생성
      const cardUpdateMap = new Map();
      newCards.forEach((card, index) => {
        cardUpdateMap.set(card.id, index);
      });

      updatedCards = cards.map((card) => {
        const newOrder = cardUpdateMap.get(card.id);
        if (newOrder !== undefined && card.columnId === sourceColumnId) {
          // order가 변경된 경우에만 새로운 객체 생성
          return { ...card, order: newOrder };
        }
        // 변경되지 않은 카드는 그대로 유지 (참조 유지)
        return card;
      });

      // 실제로 순서가 바뀐 카드만 업데이트 (최적화)
      const minIndex = Math.min(source.index, destination.index);
      const maxIndex = Math.max(source.index, destination.index);
      
      for (let i = minIndex; i <= maxIndex; i++) {
        const card = newCards[i];
        if (card) {
          updates.push({
            cardId: card.id,
            updates: { order: i },
          });
        }
      }
    } else {
      // 다른 컬럼으로 이동
      const newSourceCards = Array.from(sourceCards);
      newSourceCards.splice(source.index, 1);

      const newDestCards = Array.from(destCards);
      newDestCards.splice(destination.index, 0, draggedCard);

      // 드래그된 카드 확인
      const draggedCardInCards = cards.find(c => c.id === draggedCard.id);
      if (!draggedCardInCards) {
        console.error('드래그된 카드를 찾을 수 없습니다:', draggedCard.id);
        isDraggingRef.current = false;
        return;
      }

      // 불변성 보장: map을 사용하여 업데이트 정보 수집
      const sourceCardUpdateMap = new Map();
      newSourceCards.forEach((card, index) => {
        sourceCardUpdateMap.set(card.id, { order: index, columnId: sourceColumnId });
      });

      const destCardUpdateMap = new Map();
      newDestCards.forEach((card, index) => {
        destCardUpdateMap.set(card.id, { order: index, columnId: destColumnId });
      });

      // 불변성 보장: map을 사용하여 새로운 배열과 객체 생성
      updatedCards = cards.map((card) => {
        // 소스 컬럼의 카드 업데이트 (드래그된 카드 제외)
        if (card.columnId === sourceColumnId && card.id !== draggedCard.id) {
          const update = sourceCardUpdateMap.get(card.id);
          if (update) {
            return { ...card, order: update.order };
          }
        }
        
        // 드래그된 카드 업데이트
        if (card.id === draggedCard.id) {
          const update = destCardUpdateMap.get(card.id);
          if (update) {
            return { ...card, order: update.order, columnId: update.columnId };
          }
        }
        
        // 대상 컬럼의 나머지 카드 업데이트 (드래그된 카드 제외)
        if (card.columnId === destColumnId && card.id !== draggedCard.id) {
          const update = destCardUpdateMap.get(card.id);
          if (update) {
            return { ...card, order: update.order, columnId: update.columnId };
          }
        }
        
        // 변경되지 않은 카드는 그대로 유지
        return card;
      });

      // 소스 컬럼: 이동된 위치 이후의 카드만 업데이트
      for (let i = source.index; i < newSourceCards.length; i++) {
        updates.push({
          cardId: newSourceCards[i].id,
          updates: { order: i },
        });
      }

      // 드래그된 카드 업데이트 (columnId와 order 변경)
      updates.push({
        cardId: draggedCard.id,
        updates: { 
          order: destination.index,
          columnId: destColumnId 
        },
      });

      // 대상 컬럼: 삽입된 위치 이후의 카드만 업데이트 (드래그된 카드 제외)
      for (let i = destination.index + 1; i < newDestCards.length; i++) {
        updates.push({
          cardId: newDestCards[i].id,
          updates: { 
            order: i,
            columnId: destColumnId 
          },
        });
      }
    }

    // 낙관적 업데이트: 즉시 UI 반영 (서버 응답 대기 없음)
    // flushSync를 사용하여 동기적으로 리렌더링하여 즉시 반영 보장
    flushSync(() => {
      setCards(updatedCards);
    });
    
    // 드래그 종료 플래그 해제
    isDraggingRef.current = false;
    
    // Firestore 업데이트 후 500ms 동안 실시간 구독 무시 (중복 업데이트 방지)
    ignoreUpdatesUntilRef.current = Date.now() + 500;
    
    // Firestore에 일괄 업데이트 (백그라운드에서 비동기 실행)
    updateCardsOrder(updates)
      .then(() => {
        // 업데이트 완료 후 실시간 구독 재활성화
        setTimeout(() => {
          ignoreUpdatesUntilRef.current = 0;
        }, 300);
      })
      .catch((error) => {
        console.error('카드 순서 업데이트 실패:', error);
        // 실패 시 실시간 구독 재활성화
        ignoreUpdatesUntilRef.current = 0;
        isDraggingRef.current = false;
      });
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
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">{APP_TITLE}</h1>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{APP_VERSION}</span>
          </div>
          <div className="text-xs text-gray-400">
            마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div 
        className="w-full overflow-x-auto overflow-y-hidden"
        style={{ 
          height: 'calc(100vh - 80px)',
          scrollBehavior: 'smooth'
        }}
      >
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="inline-flex px-6 py-6 gap-5"
                style={{ 
                  alignItems: 'flex-start',
                  minWidth: 'max-content' // 내부 컨텐츠가 부모보다 넓어지도록 보장
                }}
              >
                {/* 기존 컬럼들 */}
                {columns
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((column, index) => {
                    // cardsByColumn에서 직접 가져와서 즉시 반영 보장
                    const columnCards = cardsByColumn[column.id] || [];
                    return (
                      <Column 
                        key={column.id} 
                        column={column} 
                        index={index}
                        cards={columnCards}
                        onUpdateColumn={handleUpdateColumn}
                        onDeleteColumn={handleDeleteColumn}
                      />
                    );
                  })}
                {provided.placeholder}

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
            )}
          </Droppable>
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
