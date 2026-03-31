Set objShell = CreateObject("WScript.Shell") 
objShell.CurrentDirectory = "D:\vj-project\vj-disp-fe\" 
objShell.Run "cmd /c 启动服务器.bat", 0, False 
