# Netlify 배포 가이드

## 1단계: GitHub에 코드 업로드 (권장)

### 방법 1: GitHub Desktop 사용 (가장 쉬움)

1. GitHub Desktop 다운로드: https://desktop.github.com
2. GitHub Desktop 실행
3. **File → Add Local Repository** 클릭
4. `C:\Users\dydy7\Desktop\padlet-shelf` 폴더 선택
5. **Publish repository** 클릭
6. Repository name 입력 (예: `padlet-shelf`)
7. **Publish repository** 클릭

### 방법 2: GitHub 웹사이트에서 직접

1. GitHub.com 접속 → 로그인
2. 우측 상단 **+** → **New repository** 클릭
3. Repository name 입력 (예: `padlet-shelf`)
4. **Create repository** 클릭
5. 아래 명령어를 터미널에서 실행:

```bash
cd C:\Users\dydy7\Desktop\padlet-shelf
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/padlet-shelf.git
git push -u origin main
```

## 2단계: Netlify 배포

### 방법 1: GitHub 연동 (권장)

1. Netlify 접속: https://www.netlify.com
2. **Sign up** 또는 **Log in** (GitHub 계정으로 로그인 권장)
3. 대시보드에서 **Add new site** → **Import an existing project** 클릭
4. **GitHub** 클릭 → GitHub 인증
5. 방금 만든 `padlet-shelf` 저장소 선택
6. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. **Show advanced** 클릭
8. **New variable** 클릭하여 다음 환경 변수 추가:

```
VITE_FIREBASE_API_KEY = AIzaSyB8CQDjNEUBxYR1OfbBE1QM0jZpUQBneqw
VITE_FIREBASE_AUTH_DOMAIN = test-ec573.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = test-ec573
VITE_FIREBASE_STORAGE_BUCKET = test-ec573.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 253454396522
VITE_FIREBASE_APP_ID = 1:253454396522:web:6edc2d3551c25b114e2e13
```

9. **Deploy site** 클릭
10. 배포 완료 후 자동으로 URL이 생성됩니다!

### 방법 2: 드래그 앤 드롭 (간단하지만 자동 업데이트 안됨)

1. 프로젝트 폴더에서 터미널 열기
2. 빌드 실행:
   ```bash
   npm run build
   ```
3. Netlify 접속: https://app.netlify.com/drop
4. `dist` 폴더를 드래그 앤 드롭
5. 배포 완료!

**주의**: 이 방법은 환경 변수를 설정할 수 없으므로 방법 1을 권장합니다.

## 3단계: 환경 변수 설정 (중요!)

Netlify 대시보드에서:
1. 사이트 선택
2. **Site settings** → **Environment variables** 클릭
3. 다음 변수들을 추가:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyB8CQDjNEUBxYR1OfbBE1QM0jZpUQBneqw` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `test-ec573.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `test-ec573` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `test-ec573.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `253454396522` |
| `VITE_FIREBASE_APP_ID` | `1:253454396522:web:6edc2d3551c25b114e2e13` |

4. **Save** 클릭
5. **Deploys** 탭에서 **Trigger deploy** → **Clear cache and deploy site** 클릭

## 4단계: 도메인 설정 (선택사항)

1. Netlify 대시보드 → 사이트 선택
2. **Domain settings** 클릭
3. **Custom domains**에서 원하는 도메인 추가 가능
4. 또는 기본 제공되는 `your-site-name.netlify.app` 사용

## 자동 배포 설정

GitHub과 연동하면:
- 코드를 푸시할 때마다 자동으로 재배포됩니다!
- Pull Request마다 미리보기 배포가 생성됩니다.

## 문제 해결

### 빌드 실패 시
- Netlify 대시보드 → **Deploys** → 실패한 배포 클릭
- 로그 확인하여 오류 확인

### 환경 변수 오류
- **Site settings** → **Environment variables** 확인
- 모든 `VITE_`로 시작하는 변수가 있는지 확인

### Firebase 연결 오류
- Firebase 콘솔에서 **Authentication** → **Settings** → **Authorized domains** 확인
- Netlify 도메인 추가 필요할 수 있음
