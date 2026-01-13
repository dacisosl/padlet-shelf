import { useEffect, useState, useRef, useMemo } from 'react';
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
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollContainerRef = useRef(null);
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
        // 드래그 중일 때만 무시 (성능 최적화)
        // ref를 사용하여 최신 드래그 상태 확인
        if (isDraggingRef.current) {
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

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        // 스크롤 가능 여부를 더 정확하게 체크
        const canScrollR = scrollLeft + clientWidth < scrollWidth - 5;
        const canScrollL = scrollLeft > 5;
        setCanScrollRight(canScrollR);
        setCanScrollLeft(canScrollL);
      }
    };

    // 즉시 체크
    checkScroll();

    // DOM 렌더링 후 다시 체크
    const timeoutId1 = setTimeout(checkScroll, 100);
    const timeoutId2 = setTimeout(checkScroll, 300);

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      
      // 컬럼이 변경될 때도 체크
      const observer = new ResizeObserver(() => {
        setTimeout(checkScroll, 50);
      });
      observer.observe(container);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        observer.disconnect();
      };
    }
  }, [columns, cards]); // cards도 의존성에 추가하여 카드 변경 시에도 체크

  // 오른쪽으로 스크롤하는 함수
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // 화면 너비의 80%만큼 스크롤
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 왼쪽으로 스크롤하는 함수
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8; // 화면 너비의 80%만큼 스크롤
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 컬럼별로 카드 분류 (매 렌더링마다 계산하여 즉시 반영 보장)
  // 컬럼별로 카드 분류 (매 렌더링마다 계산하여 즉시 반영)
  // cards 배열이 변경되면 즉시 재계산되도록 보장
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

    // 카드 드래그 처리 (섹션 드래그와 동일한 패턴)
    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    
    // 현재 카드 배열을 깊은 복사
    const newCards = [...cards];
    
    // 드래그된 카드 찾기
    const draggedCard = newCards.find(card => card.id === draggableId);
    if (!draggedCard) {
      isDraggingRef.current = false;
      return;
    }

    // 같은 컬럼 내에서 이동
    if (sourceColumnId === destColumnId) {
      // 해당 컬럼의 카드들만 필터링 및 정렬
      const columnCards = newCards
        .filter(card => card.columnId === sourceColumnId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // splice로 카드 이동
      const [removed] = columnCards.splice(source.index, 1);
      columnCards.splice(destination.index, 0, removed);
      
      // order 업데이트
      columnCards.forEach((card, index) => {
        const cardIndex = newCards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          newCards[cardIndex] = { ...newCards[cardIndex], order: index };
        }
      });

      // Firestore 업데이트 목록 생성
      const updates = columnCards.map((card, index) => ({
        cardId: card.id,
        updates: { order: index },
      }));

      // 즉시 로컬 상태 반영
      setCards(newCards);

      // Firestore에 일괄 업데이트 (백그라운드)
      updateCardsOrder(updates)
        .catch((error) => {
          console.error('카드 순서 업데이트 실패:', error);
        });

      isDraggingRef.current = false;
      return;
    }

    // 다른 컬럼으로 이동
    // 소스 컬럼의 카드들
    const sourceColumnCards = newCards
      .filter(card => card.columnId === sourceColumnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // 대상 컬럼의 카드들
    const destColumnCards = newCards
      .filter(card => card.columnId === destColumnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // 소스 컬럼에서 카드 제거
    sourceColumnCards.splice(source.index, 1);
    
    // 대상 컬럼에 카드 추가
    destColumnCards.splice(destination.index, 0, {
      ...draggedCard,
      columnId: destColumnId
    });
    
    // 모든 카드의 order 업데이트
    sourceColumnCards.forEach((card, index) => {
      const cardIndex = newCards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        newCards[cardIndex] = { ...newCards[cardIndex], order: index };
      }
    });
    
    destColumnCards.forEach((card, index) => {
      const cardIndex = newCards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        newCards[cardIndex] = { 
          ...newCards[cardIndex], 
          order: index,
          columnId: destColumnId
        };
      }
    });

    // Firestore 업데이트 목록 생성
    const updates = [
      // 소스 컬럼의 카드들
      ...sourceColumnCards.map((card, index) => ({
        cardId: card.id,
        updates: { order: index },
      })),
      // 드래그된 카드
      {
        cardId: draggedCard.id,
        updates: { 
          order: destination.index,
          columnId: destColumnId 
        },
      },
      // 대상 컬럼의 기존 카드들 (드래그된 카드 제외)
      ...destColumnCards.slice(destination.index + 1).map((card, index) => ({
        cardId: card.id,
        updates: { 
          order: destination.index + 1 + index,
          columnId: destColumnId 
        },
      })),
    ];

    // 즉시 로컬 상태 반영
    setCards(newCards);

    // Firestore에 일괄 업데이트 (백그라운드)
    updateCardsOrder(updates)
      .catch((error) => {
        console.error('카드 순서 업데이트 실패:', error);
      });

    isDraggingRef.current = false;
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

      {/* 메인 컨텐츠 영역 - 래퍼 */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
        {/* 왼쪽 화살표 인디케이터 (스크롤 가능할 때만 표시) - 화면 왼쪽 끝에 고정 */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="fixed z-30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
            style={{ 
              left: '16px',
              top: 'calc(80px + (100vh - 80px) / 2)',
              transform: 'translateY(-50%)'
            }}
            aria-label="왼쪽으로 스크롤"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-500"
              >
                <path 
                  d="M15 18L9 12L15 6" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        )}

        {/* 오른쪽 화살표 인디케이터 (스크롤 가능할 때만 표시) - 화면 오른쪽 끝에 고정 */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="fixed z-30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
            style={{ 
              right: '16px',
              top: 'calc(80px + (100vh - 80px) / 2)',
              transform: 'translateY(-50%)'
            }}
            aria-label="오른쪽으로 스크롤"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-500"
              >
                <path 
                  d="M9 18L15 12L9 6" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        )}

        {/* 스크롤 컨텐츠 영역 */}
        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto overflow-y-hidden"
          style={{ 
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
                        columns={columns}
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
