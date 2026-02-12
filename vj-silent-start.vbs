Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "d:\vj-project\vj-disp-fe\"
objShell.Run "cmd /c start-server.bat", 0, False
