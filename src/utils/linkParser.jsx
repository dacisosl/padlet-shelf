import React from 'react';

/**
 * 텍스트에서 URL을 찾아서 클릭 가능한 링크로 변환하는 함수
 * @param {string} text - 변환할 텍스트
 * @returns {Array} - 텍스트와 링크가 섞인 배열
 */
export const parseLinks = (text) => {
  if (!text) return [];

  // URL 정규식 (http://, https://, www.로 시작하는 URL)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // URL 이전의 일반 텍스트 추가
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // URL 처리
    let url = match[0];
    // www.로 시작하는 경우 http:// 추가
    if (url.startsWith('www.')) {
      url = 'https://' + url;
    }
    // 프로토콜이 없는 경우 https:// 추가
    else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    parts.push({
      type: 'link',
      content: match[0], // 원본 텍스트 표시
      url: url, // 실제 링크 URL
    });

    lastIndex = match.index + match[0].length;
  }

  // 마지막 URL 이후의 텍스트 추가
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  // URL이 없으면 전체를 텍스트로 반환
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: text,
    });
  }

  return parts;
};

/**
 * 텍스트를 링크가 포함된 React 요소로 변환
 * @param {string} text - 변환할 텍스트
 * @returns {JSX.Element} - 링크가 포함된 요소
 */
export const renderTextWithLinks = (text) => {
  const parts = parseLinks(text);
  
  return parts.map((part, index) => {
    if (part.type === 'link') {
      return (
        <a
          key={index}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => {
            e.stopPropagation(); // 카드 드래그 방지
          }}
        >
          {part.content}
        </a>
      );
    }
    return <span key={index}>{part.content}</span>;
  });
};
