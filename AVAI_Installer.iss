; =====================================================================
; Inno Setup Installer Script for AVAI Desktop Assistant (Full Stack)
; App: AVAI (Python FastAPI + React + Win32 Stealth Launcher)
; =====================================================================

#define MyAppName "AVAI Assistant"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "AVAI Team"
#define MyAppURL "https://github.com/Amankumaraman/AVAI"

[Setup]
AppId={{D37E88A1-94B6-4E8A-9630-B1479831969B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=AVAI_Setup_v1.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
OutputDir=installer_dist

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy Root Launcher Batch & VBS Scripts
Source: "Start_AVAI.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "Start_AVAI.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "Launch_AVAI.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "Install_Desktop_Shortcut.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion

; Copy Backend Code & Virtual Environment
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

; Copy Frontend Production Build Dist Folder
Source: "frontend\dist\*"; DestDir: "{app}\frontend\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\Start_AVAI.vbs"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\Start_AVAI.vbs"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\Start_AVAI.vbs"; Description: "Launch AVAI Assistant"; Flags: postinstall shellexec skipifsilent
