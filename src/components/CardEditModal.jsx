import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateCard } from '../firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/firebase';
import { compressImage, isImageFile, isFileSizeValid } from '../utils/imageCompression';

const CardEditModal = ({ card, isOpen, onClose, onUpdate }) => {
  const [text, setText] = useState(card?.text || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(card?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && card) {
      setText(card.text || '');
      setImagePreview(card.imageUrl || null);
      setImageFile(null);
    }
  }, [isOpen, card]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 형식 확인
    if (!isImageFile(file)) {
      alert('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)');
      return;
    }

    // 파일 크기 확인
    if (!isFileSizeValid(file)) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Firebase Storage URL에서 경로 추출
  const getStoragePathFromUrl = (url) => {
    if (!url) return null;
    try {
      // URL에서 경로 부분 추출
      // 예: https://firebasestorage.googleapis.com/v0/b/.../o/cards%2F123_image.jpg?alt=media
      // -> cards/123_image.jpg
      const urlObj = new URL(url);
      const pathname = decodeURIComponent(urlObj.pathname);
      const match = pathname.match(/\/o\/(.+)\?/);
      if (match) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error('URL 파싱 실패:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 텍스트와 이미지가 모두 없으면 경고 (기존 내용이 있어도 수정 가능하도록)
    if (!text.trim() && !imagePreview && !card.text && !card.imageUrl) {
      alert('텍스트 또는 이미지를 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = card.imageUrl || null;

      // 새 이미지가 있으면 업로드
      if (imageFile) {
        // 기존 이미지가 있으면 삭제
        if (card.imageUrl) {
          try {
            const oldImagePath = getStoragePathFromUrl(card.imageUrl);
            if (oldImagePath) {
              const oldImageRef = ref(storage, oldImagePath);
              await deleteObject(oldImageRef);
            }
          } catch (error) {
            console.error('기존 이미지 삭제 실패:', error);
            // 삭제 실패해도 계속 진행
          }
        }

        // 이미지 압축
        const compressedFile = await compressImage(imageFile);

        // Firebase Storage에 업로드
        const imageRef = ref(storage, `cards/${Date.now()}_${compressedFile.name}`);
        await uploadBytes(imageRef, compressedFile);
        imageUrl = await getDownloadURL(imageRef);
      } else if (!imagePreview && card.imageUrl) {
        // 이미지 제거 버튼을 눌렀을 경우 (이미지가 제거됨)
        try {
          const oldImagePath = getStoragePathFromUrl(card.imageUrl);
          if (oldImagePath) {
            const oldImageRef = ref(storage, oldImagePath);
            await deleteObject(oldImageRef);
          }
        } catch (error) {
          console.error('이미지 삭제 실패:', error);
          // 삭제 실패해도 계속 진행
        }
        imageUrl = null;
      }

      // Firestore에 카드 업데이트
      await updateCard(card.id, {
        text: text.trim() || '',
        imageUrl: imageUrl,
        updatedAt: new Date(),
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('카드 수정 실패:', error);
      alert('카드 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4"
        style={{ 
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">카드 수정</h2>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} id="card-edit-form" className="space-y-4">
            {/* 텍스트 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메모를 입력하세요... (링크는 자동으로 클릭 가능하게 변환됩니다)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                style={{ lineHeight: '1.6', minHeight: '120px' }}
                disabled={isUploading}
              />
            </div>

            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지
                </label>
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-full h-auto max-h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 이미지 업로드 버튼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {imagePreview ? '이미지 변경' : '이미지 추가'}
              </label>
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm transition-colors">
                  <span className="mr-2">📷</span>
                  {imagePreview ? '이미지 변경' : '이미지 추가'}
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            form="card-edit-form"
            onClick={handleSubmit}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          >
            {isUploading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(modalContent, document.body);
};

export default CardEditModal;
