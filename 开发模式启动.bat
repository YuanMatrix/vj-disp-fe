@echo off
chcp 65001 >nul
echo ================================
echo   VJ Display 开发模式
echo ================================
echo.
echo 正在启动开发服务器（带热重载）...
echo.

cd /d "%~dp0"

REM 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo 启动成功！
echo.
echo ================================
echo   请在浏览器中打开：
echo   http://localhost:3000
echo ================================
echo.
echo 按 Ctrl+C 可停止服务器
echo.

REM 启动开发服务器
call npm run dev

pause
