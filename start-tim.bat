@echo off
chcp 65001 >nul
title TIM
setlocal EnableDelayedExpansion

rem ============================================================
rem  Запуск TIM одним кликом.
rem
rem  Что делает: поднимает бэкенд и фронтенд, дожидается, пока
rem  фронтенд ответит, и открывает приложение в отдельном окне
rem  Chrome без адресной строки и вкладок.
rem
rem  Пути берутся от расположения этого файла (%~dp0), поэтому
rem  папку с проектом можно переносить — ярлык не сломается.
rem  Бэкенд ожидается рядом: ..\ideya project  backend
rem ============================================================

set "FRONT=%~dp0"
set "BACK=%~dp0..\ideya project  backend"
set "URL=http://localhost:3000/tg/auth"

echo.
echo   TIM — оғози барнома
echo   ------------------------------------
echo.

rem ── Бэкенд: поднимаем, только если порт 5000 свободен ──────
netstat -ano | findstr /R /C:"LISTENING" | findstr /C:":5000 " >nul
if errorlevel 1 (
  if exist "%BACK%\package.json" (
    echo   [1/3] Бекенд бароварда мешавад...
    start "TIM backend" /min cmd /c "cd /d "%BACK%" && npm run dev"
  ) else (
    echo   [1/3] ДИҚҚАТ: папкаи бекенд ёфт нашуд:
    echo         %BACK%
  )
) else (
  echo   [1/3] Бекенд аллакай кор мекунад.
)

rem ── Фронтенд ───────────────────────────────────────────────
netstat -ano | findstr /R /C:"LISTENING" | findstr /C:":3000 " >nul
if errorlevel 1 (
  echo   [2/3] Барнома бароварда мешавад...
  start "TIM frontend" /min cmd /c "cd /d "%FRONT%" && npm run dev"
) else (
  echo   [2/3] Барнома аллакай кор мекунад.
)

rem ── Ждём, пока фронтенд начнёт отвечать (до 60 секунд) ─────
echo   [3/3] Интизорӣ...
set /a TRIES=0
:wait
set /a TRIES+=1
powershell -NoProfile -Command "try{$null=Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2;exit 0}catch{exit 1}" >nul 2>&1
if not errorlevel 1 goto ready
if %TRIES% GEQ 30 goto timeout
timeout /t 2 /nobreak >nul
goto wait

:timeout
echo.
echo   Барнома дар 60 сония ҷавоб надод.
echo   Тирезаи "TIM frontend"-ро кушоед ва хаторо бинед.
echo.
pause
exit /b 1

:ready
rem ── Ищем Chrome ────────────────────────────────────────────
set "CHROME="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do if not defined CHROME if exist %%P set "CHROME=%%~P"

if defined CHROME (
  rem --app даёт окно без адресной строки, вкладок и кнопок —
  rem снаружи это уже не браузер, а программа.
  start "" "%CHROME%" --app=%URL%
) else (
  echo   Chrome ёфт нашуд — дар браузери оддӣ кушода мешавад.
  start "" %URL%
)

exit /b 0
