@echo off
echo ========================================================
echo   AVAI Full-Stack Windows Installer Build Automation
echo ========================================================
echo.

:: Step 1: Clean build directories
echo [1/4] Cleaning previous build artifacts...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "backend\dist" rmdir /s /q "backend\dist"
if exist "backend\build" rmdir /s /q "backend\build"
if exist "installer_dist" rmdir /s /q "installer_dist"

:: Step 2: Build Production Frontend
echo [2/4] Building React Frontend static bundle...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b %errorlevel%
)
cd ..

:: Step 3: Package Python Backend with PyInstaller
echo [3/4] Packaging Python Backend with PyInstaller...
cd backend
call pip install pyinstaller
call pyinstaller --noconfirm AVAI_Backend.spec
if %errorlevel% neq 0 (
    echo [ERROR] PyInstaller backend build failed!
    exit /b %errorlevel%
)
cd ..

:: Step 4: Compile Inno Setup Installer
echo [4/4] Compiling Windows Installer executable via Inno Setup...
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" AVAI_Installer.iss
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    "C:\Program Files\Inno Setup 6\ISCC.exe" AVAI_Installer.iss
) else (
    echo [INFO] Inno Setup compiler ISCC.exe not found in default path.
    echo Please install Inno Setup 6 from https://jrsoftware.org/isdl.php
    echo Then run: ISCC.exe AVAI_Installer.iss
)

echo.
echo ========================================================
echo   BUILD COMPLETE! Check 'installer_dist\AVAI_Setup_v1.0.exe'
echo ========================================================
pause
