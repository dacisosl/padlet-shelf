import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import AddCardButton from './AddCardButton';

const Column = ({ column, index, cards, onUpdateColumn, onDeleteColumn }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

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

  return (
    <Draggable draggableId={column.id} index={index} type="COLUMN">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-[320px] flex flex-col"
          style={{
            maxHeight: 'calc(100vh - 140px)',
            height: 'calc(100vh - 140px)', // 고정 높이로 가로 스크롤 시 일관성 유지
            ...provided.draggableProps.style,
          }}
        >
          <div 
            className={`bg-white rounded-xl p-4 flex flex-col h-full transition-all ${
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
              className="mb-4 pb-3 border-b-2 border-gray-200 flex-shrink-0 relative cursor-grab active:cursor-grabbing"
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
              className="w-full text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <>
              <h2 
                className="text-lg font-bold text-gray-800 mb-1 pr-8 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditing(true)}
                title="클릭하여 제목 수정"
              >
                {column.title}
              </h2>
              <p className="text-xs text-gray-500 font-medium">{cards.length}개 카드</p>
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
            <div className="flex-1 min-h-0 flex flex-col">
              <Droppable droppableId={column.id} type="CARD">
                {(providedDroppable, snapshot) => (
                  <div
                    ref={providedDroppable.innerRef}
                    {...providedDroppable.droppableProps}
                    className={`flex-1 transition-all rounded-lg overflow-y-auto overflow-x-hidden ${
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
                        <Card key={card.id} card={card} index={cardIndex} />
                      ))}
                      {providedDroppable.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
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
