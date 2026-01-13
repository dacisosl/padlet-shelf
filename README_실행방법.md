# 실행 방법

## 방법 1: 배치 파일 실행 (가장 쉬움) ⭐

1. 프로젝트 폴더에서 `start.bat` 파일을 **더블클릭**
2. 자동으로 개발 서버가 시작됩니다
3. 브라우저에서 `http://localhost:5173` 접속

## 방법 2: PowerShell 스크립트 실행

1. 프로젝트 폴더에서 `start.ps1` 파일을 **우클릭**
2. **PowerShell로 실행** 선택
3. 브라우저에서 `http://localhost:5173` 접속

## 방법 3: 터미널에서 직접 실행

### CMD (명령 프롬프트) 사용:
```cmd
cd C:\Users\dydy7\Desktop\padlet-shelf
npm run dev
```

### PowerShell 사용:
```powershell
cd C:\Users\dydy7\Desktop\padlet-shelf
npm.cmd run dev
```

---

## 서버 중지 방법

터미널 창에서 `Ctrl + C`를 누르면 서버가 중지됩니다.

## 문제 해결

- **포트가 이미 사용 중**: 다른 포트로 실행하려면 `vite.config.js`에서 포트 변경
- **에러 발생**: 터미널의 에러 메시지를 확인하세요
