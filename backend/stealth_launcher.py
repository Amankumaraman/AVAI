"""
Stealth Desktop Launcher for Multimodal AI Assistant
----------------------------------------------------
1. Applies WDA_EXCLUDEFROMCAPTURE to make application window INVISIBLE to Google Meet & Zoom screen share.
2. Removes application window icon from Windows Taskbar (WS_EX_TOOLWINDOW).
"""

import sys
import ctypes
import time
import threading

# Windows API Constants
WDA_EXCLUDEFROMCAPTURE = 0x00000011  # Excludes window from Google Meet / Zoom capture
GWL_EXSTYLE = -20
WS_EX_APPWINDOW = 0x00040000
WS_EX_TOOLWINDOW = 0x00000080
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_NOZORDER = 0x0004
SWP_FRAMECHANGED = 0x0020


def hide_from_taskbar(hwnd):
    """Removes window icon from Windows Taskbar using WS_EX_TOOLWINDOW style."""
    try:
        user32 = ctypes.windll.user32
        style = user32.GetWindowLongW(int(hwnd), GWL_EXSTYLE)
        new_style = (style & ~WS_EX_APPWINDOW) | WS_EX_TOOLWINDOW
        user32.SetWindowLongW(int(hwnd), GWL_EXSTYLE, new_style)
        user32.SetWindowPos(int(hwnd), 0, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED)
        print(f"[SUCCESS] Window HWND {hwnd} HIDDEN from Windows Taskbar!")
        return True
    except Exception as e:
        print(f"[WARNING] Could not hide HWND {hwnd} from Taskbar: {e}")
        return False


def set_window_stealth(hwnd):
    """Applies WDA_EXCLUDEFROMCAPTURE to target window handle."""
    try:
        user32 = ctypes.windll.user32
        result = user32.SetWindowDisplayAffinity(int(hwnd), WDA_EXCLUDEFROMCAPTURE)
        if result:
            print(f"[SUCCESS] Window HWND {hwnd} is now 100% INVISIBLE to Google Meet & Screen Share!")
            hide_from_taskbar(hwnd)
            return True
        else:
            print(f"[WARNING] Could not set affinity for HWND {hwnd} (Error code: {ctypes.GetLastError()})")
            return False
    except Exception as e:
        print(f"[ERROR] Exception setting stealth mode: {e}")
        return False


def find_and_protect_windows(title_substring="AVAI"):
    """Finds windows matching title and excludes them from capture & taskbar."""
    user32 = ctypes.windll.user32
    EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    protected_hwnds = set()

    def enum_cb(hwnd, lparam):
        if user32.IsWindowVisible(hwnd):
            length = user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            title = buff.value
            if title_substring.lower() in title.lower() and hwnd not in protected_hwnds:
                print(f"[FOUND WINDOW] '{title}' (HWND: {hwnd})")
                if set_window_stealth(hwnd):
                    protected_hwnds.add(hwnd)
        return True

    user32.EnumWindows(EnumWindowsProc(enum_cb), 0)


def main():
    print("==========================================================")
    print("  AVAI STEALTH LAUNCHER - Screen Share & Taskbar Hiding")
    print("==========================================================")

    try:
        import webview

        print("[+] Launching PyWebView Native Stealth Window...")
        window = webview.create_window(
            title="AVAI - Stealth Interview Assistant",
            url="http://127.0.0.1:8000",
            width=850,
            height=850,
            on_top=True,
            resizable=True,
            background_color='#090d16',
        )

        def apply_protection_loop():
            for _ in range(10):
                time.sleep(1)
                find_and_protect_windows("AVAI")

        threading.Thread(target=apply_protection_loop, daemon=True).start()
        webview.start()

    except Exception as e:
        print(f"[!] Falling back to browser HWND watcher: {e}")
        try:
            while True:
                find_and_protect_windows("AVAI")
                time.sleep(2)
        except KeyboardInterrupt:
            print("\nExiting stealth launcher.")


if __name__ == "__main__":
    main()
