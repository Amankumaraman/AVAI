import os
import sys

def create_desktop_shortcut():
    desktop = os.path.expanduser("~/Desktop")
    shortcut_path = os.path.join(desktop, "AVAI Assistant.lnk")
    target_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Start_AVAI.vbs"))
    work_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    vbs_content = f"""
Set WshShell = CreateObject("WScript.Shell")
Set oShortcut = WshShell.CreateShortcut("{shortcut_path}")
oShortcut.TargetPath = "{target_path}"
oShortcut.WorkingDirectory = "{work_dir}"
oShortcut.Description = "AVAI Stealth Multimodal Voice & Vision Assistant"
oShortcut.Save
"""
    vbs_path = os.path.join(os.environ.get("TEMP", "."), "create_avai_shortcut.vbs")
    with open(vbs_path, "w", encoding="utf-8") as f:
        f.write(vbs_content)

    res = os.system(f'cscript //nologo "{vbs_path}"')
    if os.path.exists(vbs_path):
        os.remove(vbs_path)

    if os.path.exists(shortcut_path):
        print(f"[SUCCESS] Desktop Shortcut created at: {shortcut_path}")
    else:
        print(f"[INFO] You can double click 'Start_AVAI.vbs' in '{work_dir}' anytime!")

if __name__ == "__main__":
    create_desktop_shortcut()
