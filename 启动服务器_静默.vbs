Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "d:\vj-project\vj-disp-fe\"
objShell.Run "cmd /c 启动服务器.bat", 0, False
