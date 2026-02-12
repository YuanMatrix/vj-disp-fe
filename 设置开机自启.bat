@echo off
chcp 65001 >nul
echo ================================
echo   设置 VJ Display 开机自启动
echo ================================
echo.

cd /d "%~dp0"

REM 创建一个用于开机启动的 VBS 脚本（静默启动，不弹窗）
set "VBS_FILE=%~dp0启动服务器_静默.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\VJ-Display.lnk"

REM 先创建静默启动的 VBS 脚本（隐藏命令行窗口）
echo Set objShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo objShell.CurrentDirectory = "%~dp0" >> "%VBS_FILE%"
echo objShell.Run "cmd /c 启动服务器.bat", 0, False >> "%VBS_FILE%"

echo 选择启动方式:
echo.
echo   1. 开机自启动（后台静默运行，无窗口）
echo   2. 开机自启动（显示命令行窗口）
echo   3. 取消开机自启动
echo   4. 退出
echo.
set /p choice=请输入选项 (1/2/3/4): 

if "%choice%"=="1" goto silent
if "%choice%"=="2" goto visible
if "%choice%"=="3" goto remove
if "%choice%"=="4" goto end

:silent
REM 静默方式：复制 VBS 到启动文件夹
copy /Y "%VBS_FILE%" "%STARTUP_FOLDER%\VJ-Display.vbs" >nul
if exist "%SHORTCUT%" del "%SHORTCUT%" >nul 2>&1
echo.
echo ✓ 已设置开机自启动（静默模式）
echo   启动文件: %STARTUP_FOLDER%\VJ-Display.vbs
echo.
echo   服务将在后台运行，浏览器访问 http://localhost:3000
echo   如需停止服务，请在任务管理器中结束 node.exe 进程
goto done

:visible
REM 显示窗口方式：创建快捷方式到启动文件夹
set "BAT_FILE=%~dp0启动服务器.bat"

REM 用 PowerShell 创建快捷方式
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%BAT_FILE%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'VJ Display Server'; $s.Save()"

if exist "%STARTUP_FOLDER%\VJ-Display.vbs" del "%STARTUP_FOLDER%\VJ-Display.vbs" >nul 2>&1
echo.
echo ✓ 已设置开机自启动（显示窗口模式）
echo   快捷方式: %SHORTCUT%
echo.
echo   开机后会弹出命令行窗口显示服务状态
goto done

:remove
if exist "%SHORTCUT%" del "%SHORTCUT%" >nul 2>&1
if exist "%STARTUP_FOLDER%\VJ-Display.vbs" del "%STARTUP_FOLDER%\VJ-Display.vbs" >nul 2>&1
echo.
echo ✓ 已取消开机自启动
goto done

:done
echo.
echo --------------------------------
echo   当前启动文件夹内容:
dir "%STARTUP_FOLDER%\VJ-Display*" /B 2>nul || echo   (无 VJ-Display 相关项)
echo --------------------------------

:end
echo.
pause
