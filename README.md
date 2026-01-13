# 패들렛 셸프 모드 웹 애플리케이션

React와 Firebase를 사용하여 만든 Padlet의 Shelf 모드와 유사한 웹 애플리케이션입니다.

## 주요 기능

- ✅ Firebase 익명 인증 (자동 로그인)
- ✅ 가로 스크롤 가능한 여러 컬럼
- ✅ 드래그 앤 드롭으로 카드 이동
- ✅ 이미지 업로드 및 자동 압축 (최대 0.5MB, 1200px)
- ✅ 실시간 Firestore 동기화
- ✅ 모던한 UI/UX

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. Firebase 설정

1. Firebase 콘솔에서 새 프로젝트 생성
2. Authentication에서 "익명 로그인" 활성화
3. Firestore Database 생성 (테스트 모드 또는 규칙 설정)
4. Storage 생성 (규칙 설정)
5. `.env` 파일 생성 및 Firebase 설정 값 입력:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore 규칙 설정

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /columns/{document=**} {
      allow read, write: if true;
    }
    match /cards/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Storage 규칙 설정

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cards/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. 개발 서버 실행

```bash
npm run dev
```

## 프로젝트 구조

```
src/
├── components/
│   ├── Board.jsx          # 메인 보드 컴포넌트
│   ├── Column.jsx         # 컬럼 컴포넌트
│   ├── Card.jsx           # 카드 컴포넌트
│   └── AddCardButton.jsx  # 카드 추가 버튼
├── firebase/
│   ├── firebase.js        # Firebase 초기화
│   └── firestore.js       # Firestore 함수
├── hooks/
│   └── useAuth.js         # 인증 훅
├── utils/
│   └── imageCompression.js # 이미지 압축 유틸
├── App.jsx
└── main.jsx
```

## 사용된 기술

- **React** (Vite)
- **Tailwind CSS**
- **@hello-pangea/dnd** (드래그 앤 드롭)
- **Firebase** (Authentication, Firestore, Storage)
- **browser-image-compression** (이미지 압축)

## 주요 기능 설명

### 이미지 업로드 정책

- 파일 형식: `.jpg`, `.png`, `.gif`, `.webp`만 허용
- 용량 제한: 5MB 초과 시 업로드 차단
- 자동 압축: 업로드 전 브라우저에서 압축 (최대 1200px, 0.5MB 이하)

### 드래그 앤 드롭

- 같은 컬럼 내에서 위아래 이동
- 다른 컬럼으로 이동
- 실시간으로 Firestore에 동기화

### 익명 인증

- 사이트 접속 시 자동으로 익명 로그인
- 각 카드에 작성자 `uid` 저장
- 본인 카드만 삭제 가능
