Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "f:\question app\backend"
WshShell.Run """C:\Python314\pythonw.exe"" app_launcher.py", 0, False
