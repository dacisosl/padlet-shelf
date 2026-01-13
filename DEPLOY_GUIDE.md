# GitHub & Netlify 배포 가이드

## 1단계: GitHub 저장소 생성 및 코드 업로드

### 방법 1: GitHub Desktop 사용 (가장 쉬움)

1. **GitHub Desktop 다운로드**
   - https://desktop.github.com 접속
   - 다운로드 및 설치

2. **저장소 생성 및 푸시**
   - GitHub Desktop 실행
   - File → Add Local Repository
   - `C:\Users\dydy7\Desktop\padlet-shelf` 폴더 선택
   - "This directory does not appear to be a Git repository" 메시지가 나오면
     - "create a repository" 클릭
   - 좌측 하단 "Publish repository" 클릭
   - Repository name 입력 (예: `padlet-shelf`)
   - "Keep this code private" 체크 해제 (공개 저장소)
   - "Publish repository" 클릭

### 방법 2: GitHub 웹사이트에서 직접

1. **GitHub.com 접속 및 로그인**
   - https://github.com 접속
   - 로그인

2. **새 저장소 생성**
   - 우측 상단 **+** → **New repository** 클릭
   - Repository name: `padlet-shelf`
   - Description: (선택사항) "Padlet-style Kanban board with Firebase"
   - Public 선택
   - **Initialize this repository with a README** 체크 해제
   - **Create repository** 클릭

3. **터미널에서 코드 푸시**
   ```bash
   cd C:\Users\dydy7\Desktop\padlet-shelf
   git init
   git add .
   git commit -m "Initial commit: Padlet-style Kanban board"
   git branch -M main
   git remote add origin https://github.com/사용자명/padlet-shelf.git
   git push -u origin main
   ```

## 2단계: Netlify 배포

### 1. Netlify 계정 생성 및 로그인

1. **Netlify 접속**
   - https://www.netlify.com 접속
   - **Sign up** 클릭
   - **GitHub**로 로그인 (권장)

### 2. GitHub 저장소 연동

1. **새 사이트 추가**
   - Netlify 대시보드에서 **Add new site** 클릭
   - **Import an existing project** 선택
   - **GitHub** 클릭
   - GitHub 인증 (처음이면 권한 허용)
   - `padlet-shelf` 저장소 선택

2. **빌드 설정**
   - **Branch to deploy**: `main` (기본값)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Show advanced** 클릭

3. **환경 변수 추가**
   - **New variable** 버튼 클릭하여 다음 변수들 추가:

   | Key | Value |
   |-----|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyB8CQDjNEUBxYR1OfbBE1QM0jZpUQBneqw` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `test-ec573.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `test-ec573` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `test-ec573.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `253454396522` |
   | `VITE_FIREBASE_APP_ID` | `1:253454396522:web:6edc2d3551c25b114e2e13` |

4. **배포 시작**
   - **Deploy site** 클릭
   - 배포가 시작됩니다 (약 1-2분 소요)

### 3. 배포 완료 확인

1. **배포 상태 확인**
   - Netlify 대시보드에서 배포 진행 상황 확인
   - 성공하면 초록색 체크 표시

2. **사이트 URL 확인**
   - 배포 완료 후 자동으로 생성된 URL 확인
   - 예: `https://padlet-shelf-123456.netlify.app`

## 3단계: Firebase 도메인 허용 설정

### Firebase 콘솔에서 도메인 추가

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com
   - 프로젝트 `test-ec573` 선택

2. **Authentication 설정**
   - 왼쪽 메뉴에서 **Authentication** 클릭
   - **Settings** 탭 클릭
   - **Authorized domains** 섹션에서
   - **Add domain** 클릭
   - Netlify 도메인 입력 (예: `padlet-shelf-123456.netlify.app`)
   - **Add** 클릭

## 4단계: 커스텀 도메인 설정 (선택사항)

1. **Netlify 대시보드**
   - 사이트 선택
   - **Domain settings** 클릭
   - **Add custom domain** 클릭
   - 원하는 도메인 입력
   - DNS 설정 안내에 따라 도메인 연결

## 자동 배포 설정

✅ **이미 설정됨!**
- GitHub에 코드를 푸시하면 자동으로 Netlify에서 재배포됩니다
- Pull Request마다 미리보기 배포가 생성됩니다

## 문제 해결

### 빌드 실패 시
- Netlify 대시보드 → **Deploys** → 실패한 배포 클릭
- 로그 확인하여 오류 확인
- 일반적인 원인:
  - 환경 변수 누락
  - 빌드 명령어 오류
  - 의존성 설치 실패

### 환경 변수 오류
- **Site settings** → **Environment variables** 확인
- 모든 `VITE_`로 시작하는 변수가 있는지 확인
- 변수 이름에 오타가 없는지 확인

### Firebase 연결 오류
- Firebase 콘솔에서 **Authorized domains** 확인
- Netlify 도메인이 추가되었는지 확인
- Firestore 및 Storage 규칙 확인

## 완료!

이제 웹사이트가 공개적으로 접근 가능합니다! 🎉
