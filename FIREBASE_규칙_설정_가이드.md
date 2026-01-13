# Firebase 보안 규칙 설정 (필수!)

## 문제: "Missing or insufficient permissions" 오류

이 오류는 Firestore 보안 규칙이 모든 접근을 차단하고 있기 때문입니다.

## 해결 방법

### 1. Firestore 보안 규칙 설정

1. Firebase 콘솔 접속: https://console.firebase.google.com
2. 프로젝트 선택: **test-ec573**
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **Rules** 클릭
5. 다음 규칙을 복사해서 붙여넣기:

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

6. **게시** 버튼 클릭

### 2. Storage 보안 규칙 설정

1. Firebase 콘솔에서 **Storage** 클릭
2. 상단 탭에서 **Rules** 클릭
3. 다음 규칙을 복사해서 붙여넣기:

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

4. **게시** 버튼 클릭

### 3. Authentication 설정 확인

1. Firebase 콘솔에서 **Authentication** 클릭
2. **Sign-in method** 탭 클릭
3. **익명** 로그인 방법 찾기
4. **사용 설정** 토글을 **ON**으로 변경
5. **저장** 클릭

## 중요!

위 설정을 완료한 후:
1. 브라우저를 **완전히 닫았다가 다시 열기**
2. `start.bat`를 다시 실행
3. 페이지 새로고침 (F5)

이제 정상적으로 작동할 것입니다!
