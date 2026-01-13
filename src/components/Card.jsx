import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../hooks/useAuth';
import { renderTextWithLinks } from '../utils/linkParser.jsx';
import CardEditModal from './CardEditModal';

const Card = ({ card, index }) => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-200 relative ${
            snapshot.isDragging 
              ? 'shadow-2xl rotate-1 scale-105 z-50' 
              : isEditModalOpen 
                ? '' 
                : 'hover:shadow-lg hover:-translate-y-1 hover:border-gray-200'
          }`}
          style={{
            borderRadius: '14px',
            pointerEvents: isEditModalOpen ? 'none' : 'auto',
            boxShadow: snapshot.isDragging 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* 드래그 핸들 */}
          <div 
            {...provided.dragHandleProps} 
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              // 링크 클릭이 아닐 때만 드래그 허용
              if (e.target.closest('a')) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              // 모달이 열려있으면 클릭 무시
              if (isEditModalOpen) {
                e.stopPropagation();
                return;
              }
              // 링크 클릭이 아닐 때만 모달 열기
              if (!e.target.closest('a')) {
                setIsEditModalOpen(true);
              }
            }}
          >

            {/* 이미지가 있으면 표시 */}
            {card.imageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={card.imageUrl}
                  alt={card.text || 'Card image'}
                  className="w-full h-auto object-cover max-h-64"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* 텍스트 내용 (링크 자동 변환) */}
            {card.text && (
              <div 
                className="text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed"
                style={{ lineHeight: '1.6' }}
              >
                {renderTextWithLinks(card.text)}
              </div>
            )}

            {/* 빈 카드일 때 안내 */}
            {!card.text && !card.imageUrl && (
              <p className="text-gray-400 text-sm italic">빈 카드</p>
            )}
          </div>

          {/* 수정 모달 */}
          <CardEditModal
            card={card}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={() => {
              // 카드 업데이트 후 모달 닫기
              setIsEditModalOpen(false);
            }}
          />
        </div>
      )}
    </Draggable>
  );
};

export default Card;
