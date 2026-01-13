import { useState, useRef } from 'react';
import { addCard } from '../firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { compressImage, isImageFile, isFileSizeValid } from '../utils/imageCompression';

const AddCardButton = ({ columnId, currentCardCount = 0 }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!text.trim() && !imageFile) {
      alert('텍스트 또는 이미지를 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = null;

      // 이미지가 있으면 압축 후 업로드
      if (imageFile) {
        // 이미지 압축
        const compressedFile = await compressImage(imageFile);

        // Firebase Storage에 업로드
        const imageRef = ref(storage, `cards/${Date.now()}_${compressedFile.name}`);
        await uploadBytes(imageRef, compressedFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Firestore에 카드 추가
      const cardData = {
        columnId,
        text: text.trim(),
        imageUrl,
        uid: user.uid,
        createdAt: new Date(),
        order: currentCardCount, // 컬럼 내 카드 수를 기반으로 순서 설정
      };

      await addCard(cardData);

      // 폼 초기화
      setText('');
      setImageFile(null);
      setImagePreview(null);
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('카드 추가 실패:', error);
      alert('카드 추가에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setImageFile(null);
    setImagePreview(null);
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-3 py-3 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-xl font-medium transition-all flex items-center justify-center shadow-sm hover:shadow-md border border-gray-200/50 hover:border-blue-300"
      >
        <span className="mr-2 text-xl">+</span>
        카드 추가
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-lg">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메모를 입력하세요... (링크는 자동으로 클릭 가능하게 변환됩니다)"
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        style={{ lineHeight: '1.6' }}
        rows="4"
        disabled={isUploading}
      />

      {/* 이미지 미리보기 */}
      {imagePreview && (
        <div className="mt-3 relative rounded-lg overflow-hidden bg-gray-100">
          <img
            src={imagePreview}
            alt="미리보기"
            className="w-full h-auto max-h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setImageFile(null);
              setImagePreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 이미지 업로드 버튼 */}
      <label className="mt-3 block">
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
          이미지 추가
        </span>
      </label>

      {/* 버튼들 */}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isUploading ? '업로드 중...' : '추가'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
};

export default AddCardButton;
