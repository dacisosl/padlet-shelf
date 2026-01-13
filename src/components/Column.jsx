import { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import AddCardButton from './AddCardButton';

const Column = ({ column, index, cards, columns, onUpdateColumn, onDeleteColumn }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [columnHeight, setColumnHeight] = useState('calc(100vh - 100px)');
  const scrollContainerRef = useRef(null);

  const handleSave = async () => {
    if (!editTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (editTitle.trim() !== column.title) {
      await onUpdateColumn(column.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleCancel = () => {
    setEditTitle(column.title);
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${column.title}" 섹션을 삭제하시겠습니까?`)) return;
    await onDeleteColumn(column.id);
    setShowMenu(false);
  };

  // 반응형 높이 설정
  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth >= 640) {
        setColumnHeight('calc(100vh - 140px)');
      } else {
        setColumnHeight('calc(100vh - 100px)');
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      
      const observer = new ResizeObserver(() => {
        setTimeout(checkScroll, 50);
      });
      observer.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }
  }, [cards]); // cards가 변경될 때마다 체크

  // 아래로 스크롤하는 함수
  const scrollDown = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientHeight * 0.7; // 컨테이너 높이의 70%만큼 스크롤
      container.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Draggable draggableId={String(column.id)} index={index} type="COLUMN">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] flex flex-col"
          style={{
            maxHeight: columnHeight,
            height: columnHeight,
            ...provided.draggableProps.style,
          }}
        >
          <div 
            className={`bg-white rounded-xl p-3 sm:p-4 flex flex-col h-full transition-all ${
              snapshot.isDragging ? 'shadow-2xl rotate-1 scale-105' : ''
            }`}
            style={{
              border: '2px solid #e5e7eb',
              boxShadow: snapshot.isDragging
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* 컬럼 헤더 */}
            <div 
              {...provided.dragHandleProps}
              className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-gray-200 flex-shrink-0 relative cursor-grab active:cursor-grabbing"
            >
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              className="w-full text-base sm:text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <>
              <h2 
                className="text-base sm:text-lg font-bold text-gray-800 mb-1 pr-6 sm:pr-8 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditing(true)}
                title="클릭하여 제목 수정"
              >
                {column.title}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{cards.length}개 카드</p>
              {/* 메뉴 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="섹션 메뉴"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* 메뉴 드롭다운 */}
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute top-8 right-0 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      이름 변경
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

            {/* 드롭 영역 - 동적 높이, 스크롤 가능 */}
            <div className="flex-1 min-h-0 flex flex-col relative">
              <Droppable droppableId={String(column.id)} type="CARD">
                {(providedDroppable, snapshot) => (
                  <div
                    ref={(node) => {
                      providedDroppable.innerRef(node);
                      scrollContainerRef.current = node;
                    }}
                    {...providedDroppable.droppableProps}
                    className={`flex-1 rounded-lg overflow-y-auto overflow-x-hidden ${
                      snapshot.isDraggingOver 
                        ? 'bg-blue-50/50 border-2 border-blue-300 border-dashed' 
                        : ''
                    }`}
                    style={{ 
                      minHeight: '100px'
                    }}
                  >
                    <div className="space-y-3 pr-1">
                      {cards.map((card, cardIndex) => (
                        <Card key={card.id} card={card} index={cardIndex} columns={columns} />
                      ))}
                      {providedDroppable.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>

              {/* 아래쪽 화살표 인디케이터 (스크롤 가능할 때만 표시) */}
              {canScrollDown && (
                <button
                  onClick={scrollDown}
                  className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-200 touch-manipulation"
                  aria-label="아래로 스크롤"
                >
                  <div className="bg-red-100/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg border border-red-200 active:bg-red-200 active:shadow-xl transition-all duration-200">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-red-400 sm:w-5 sm:h-5"
                    >
                      <path 
                        d="M6 9L12 15L18 9" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              )}
            </div>

            {/* 카드 추가 버튼 - 항상 보이도록 */}
            <div className="mt-3 flex-shrink-0">
              <AddCardButton columnId={column.id} currentCardCount={cards.length} />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Column;
