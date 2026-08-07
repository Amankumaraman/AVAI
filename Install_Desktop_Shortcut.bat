@echo off
title Installing AVAI Desktop Shortcut
color 0B
cls
echo ==========================================================
echo        Installing AVAI Desktop Shortcut...
echo ==========================================================
echo.

set "TARGET=%~dp0Start_AVAI.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\AVAI Assistant.lnk"
set "WORKDIR=%~dp0"

powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath='%TARGET%'; $s.WorkingDirectory='%WORKDIR%'; $s.Description='AVAI Stealth Multimodal Voice & Vision Assistant'; $s.Save()"

if exist "%SHORTCUT%" (
    echo [SUCCESS] Desktop shortcut 'AVAI Assistant' created successfully on your Desktop!
) else (
    echo [INFO] You can double click 'Start_AVAI.bat' in 'f:\question app' anytime!
)
echo.
pause
