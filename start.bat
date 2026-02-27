@echo off
echo ========================================
echo 超市商品管理平台 - 启动脚本
echo ========================================
echo.

echo [1] 启动后端服务
echo [2] 启动前端服务
echo [3] 同时启动前后端服务
echo [4] 退出
echo.

set /p choice=请选择操作 (1-4): 

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto end

:backend
echo.
echo 正在启动后端服务...
cd /d %~dp0
node server.js
goto end

:frontend
echo.
echo 正在启动前端服务...
cd /d %~dp0client
npm start
goto end

:both
echo.
echo 正在启动后端服务...
start "后端服务" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 3 /nobreak >nul
echo.
echo 正在启动前端服务...
cd /d %~dp0client
npm start
goto end

:end
echo.
echo 按任意键退出...
pause >nul