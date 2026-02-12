@echo off
chcp 65001 >nul
title VJ Display 一键启动
color 0A

echo.
echo ╔════════════════════════════════════════╗
echo ║     VJ Display 视频生成系统           ║
echo ║         一键安装并启动                 ║
echo ╚════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js: https://nodejs.org/
    echo 推荐安装 LTS 版本
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js 已安装
node --version
echo.

REM 检查 npm 是否可用
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] npm 不可用
    pause
    exit /b 1
)

echo [✓] npm 已就绪
npm --version
echo.

REM 检查 .env.local 配置
if not exist ".env.local" (
    echo ════════════════════════════════════════
    echo   [提示] 首次使用需要配置 ComfyUI 路径
    echo ════════════════════════════════════════
    echo.
    echo 已创建 .env.local 文件，请按以下步骤操作：
    echo.
    echo 1. 编辑 .env.local 文件
    echo 2. 将 COMFYUI_OUTPUT_BASE 设置为您的 ComfyUI 输出目录
    echo    示例: COMFYUI_OUTPUT_BASE=C:\path\to\ComfyUI\output
    echo.
    echo 详细说明请查看: ComfyUI配置说明.md
    echo.
    pause
)

REM 检查并安装依赖
if not exist "node_modules\" (
    echo ════════════════════════════════════════
    echo   首次运行，正在安装依赖...
    echo   这可能需要几分钟，请耐心等待
    echo ════════════════════════════════════════
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [✓] 依赖安装完成
    echo.
) else (
    echo [✓] 依赖已安装
    echo.
)

REM 选择启动模式
echo ════════════════════════════════════════
echo   请选择启动模式：
echo ════════════════════════════════════════
echo.
echo   [1] 开发模式（推荐）
echo       - 启动快
echo       - 支持热重载
echo       - 适合开发和测试
echo.
echo   [2] 生产模式
echo       - 性能优化
echo       - 需要先构建
echo       - 适合正式使用
echo.
echo ════════════════════════════════════════

set /p mode="请输入选项 (1 或 2，默认: 1): "

if "%mode%"=="" set mode=1
if "%mode%"=="2" goto production
goto development

:development
echo.
echo ════════════════════════════════════════
echo   启动开发模式...
echo ════════════════════════════════════════
echo.
timeout /t 2 >nul

echo [启动中] 开发服务器正在启动...
echo.
echo ┌────────────────────────────────────────┐
echo │  服务器启动后，浏览器会自动打开        │
echo │  如果没有自动打开，请手动访问：        │
echo │                                        │
echo │  http://localhost:3000                 │
echo │                                        │
echo │  按 Ctrl+C 可停止服务器                │
echo └────────────────────────────────────────┘
echo.

start http://localhost:3000

call npm run dev
goto end

:production
echo.
echo ════════════════════════════════════════
echo   启动生产模式...
echo ════════════════════════════════════════
echo.

REM 检查是否已构建
if not exist ".next\" (
    echo [构建中] 正在构建项目，这可能需要几分钟...
    echo.
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 构建失败
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [✓] 构建完成
    echo.
)

echo [启动中] 生产服务器正在启动...
echo.
echo ┌────────────────────────────────────────┐
echo │  服务器启动后，浏览器会自动打开        │
echo │  如果没有自动打开，请手动访问：        │
echo │                                        │
echo │  http://localhost:3000                 │
echo │                                        │
echo │  按 Ctrl+C 可停止服务器                │
echo └────────────────────────────────────────┘
echo.

start http://localhost:3000

call npm run start
goto end

:end
echo.
echo 服务器已停止
pause
