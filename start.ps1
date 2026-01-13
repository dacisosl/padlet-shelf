# 패들렛 보드 개발 서버 시작 스크립트
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "패들렛 보드 개발 서버 시작 중..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 현재 스크립트가 있는 디렉토리로 이동
Set-Location $PSScriptRoot

# npm 실행
& npm.cmd run dev
