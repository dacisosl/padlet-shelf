# Firebase 설정 가이드

## 1. Authentication 설정 (필수)

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: `test-ec573`
3. 왼쪽 메뉴에서 **Authentication** 클릭
4. **시작하기** 버튼 클릭 (처음이면)
5. **Sign-in method** 탭 클릭
6. **익명** 로그인 방법 찾기
7. **익명** 클릭 → **사용 설정** 토글을 **ON**으로 변경
8. **저장** 클릭

## 2. Firestore Database 생성 (필수)

1. Firebase 콘솔에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드에서 시작** 선택 (개발 중이므로)
4. 위치 선택 (asia-northeast3 - 서울 권장)
5. **사용 설정** 클릭

### Firestore 보안 규칙 설정 (선택사항 - 나중에 설정 가능)

Firestore → Rules 탭에서:

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

## 3. Storage 설정 (필수)

1. Firebase 콘솔에서 **Storage** 클릭
2. **시작하기** 버튼 클릭
3. **Firestore의 보안 규칙 사용** 선택 (또는 테스트 모드)
4. 위치 선택 (Firestore와 동일하게)
5. **완료** 클릭

### Storage 보안 규칙 설정 (선택사항 - 나중에 설정 가능)

Storage → Rules 탭에서:

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

## 4. 개발 서버 실행

터미널에서:

```bash
cd padlet-shelf
npm run dev
```

브라우저에서 표시된 URL (보통 http://localhost:5173)로 접속하세요!

## 문제 해결

- **인증 오류**: Authentication에서 익명 로그인이 활성화되었는지 확인
- **Firestore 오류**: Firestore Database가 생성되었는지 확인
- **Storage 오류**: Storage가 생성되었는지 확인
- **환경 변수 오류**: `.env` 파일이 프로젝트 루트에 있는지 확인
