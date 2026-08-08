Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "f:\question app\backend"
WshShell.Run "pythonw app_launcher.py", 0, False
