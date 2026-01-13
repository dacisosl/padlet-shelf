@echo off
chcp 65001 >nul
echo ====================================
echo 패들렛 보드 개발 서버 시작 중...
echo ====================================
echo.
echo 브라우저가 자동으로 열립니다...
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

cd /d "%~dp0"
call npm.cmd run dev

pause
