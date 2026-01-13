import imageCompression from 'browser-image-compression';

/**
 * 이미지를 압축하는 함수
 * @param {File} file - 압축할 이미지 파일
 * @returns {Promise<File>} - 압축된 이미지 파일
 */
export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.5, // 최대 0.5MB
    maxWidthOrHeight: 1200, // 최대 1200px
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    throw error;
  }
};

/**
 * 파일이 이미지인지 확인하는 함수
 * @param {File} file - 확인할 파일
 * @returns {boolean} - 이미지 파일 여부
 */
export const isImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * 파일 크기가 5MB 이하인지 확인하는 함수
 * @param {File} file - 확인할 파일
 * @returns {boolean} - 5MB 이하 여부
 */
export const isFileSizeValid = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};
