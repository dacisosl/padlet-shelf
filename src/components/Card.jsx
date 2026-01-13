import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { deleteCard } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { renderTextWithLinks } from '../utils/linkParser.jsx';
import CardEditModal from './CardEditModal';

const Card = ({ card, index }) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('이 카드를 삭제하시겠습니까?')) return;
    
    setIsDeleting(true);
    try {
      await deleteCard(card.id);
    } catch (error) {
      console.error('카드 삭제 실패:', error);
      alert('카드 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = user && card.uid === user.uid;

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
          {/* 삭제 버튼 (X 표시) - 본인 카드만 */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(e);
              }}
              disabled={isDeleting}
              className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white z-30 shadow-lg hover:shadow-xl transition-all"
              style={{
                pointerEvents: 'auto',
              }}
              title="카드 삭제"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          )}

          {/* 드래그 핸들 */}
          <div 
            {...provided.dragHandleProps} 
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              // X 버튼이나 링크 클릭이 아닐 때만 드래그 허용
              if (e.target.closest('button') || e.target.closest('a')) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              // 모달이 열려있으면 클릭 무시
              if (isEditModalOpen) {
                e.stopPropagation();
                return;
              }
              // X 버튼이나 링크 클릭이 아닐 때만 모달 열기
              if (!e.target.closest('button') && !e.target.closest('a')) {
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
