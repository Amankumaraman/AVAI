"""
AURA AI - Ultra-Stable Desktop App Launcher
------------------------------------------
1. Starts FastAPI backend on port 8000.
2. Launches PyWebView Native Window with easy_drag=True for header window movement.
3. Applies WDA_EXCLUDEFROMCAPTURE & WS_EX_TOOLWINDOW stealth modes.
"""

import os
import sys
import time
import ctypes
import threading
import urllib.request
import uvicorn

# Suppress console creation for all subprocesses on Windows
if sys.platform == "win32":
    try:
        import subprocess
        si = subprocess.STARTUPINFO()
        si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        si.wShowWindow = 0
    except Exception:
        pass

# Redirect stdout and stderr safely for non-console execution
if sys.stdout is None or not hasattr(sys.stdout, "write"):
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None or not hasattr(sys.stderr, "write"):
    sys.stderr = open(os.devnull, "w")

# Windows API Constants
WDA_EXCLUDEFROMCAPTURE = 0x00000011
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
        return True
    except Exception:
        return False


def set_window_stealth(hwnd):
    """Applies WDA_EXCLUDEFROMCAPTURE to target window handle."""
    try:
        user32 = ctypes.windll.user32
        result = user32.SetWindowDisplayAffinity(int(hwnd), WDA_EXCLUDEFROMCAPTURE)
        if result:
            hide_from_taskbar(hwnd)
            return True
        return False
    except Exception:
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
                if set_window_stealth(hwnd):
                    protected_hwnds.add(hwnd)
        return True

    user32.EnumWindows(EnumWindowsProc(enum_cb), 0)


def start_backend():
    """Runs uvicorn FastAPI server safely."""
    try:
        res = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=0.3)
        if res.status == 200:
            return
    except Exception:
        pass

    try:
        uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="critical", access_log=False)
    except Exception:
        pass


def wait_for_server():
    """Waits until FastAPI server is ready to prevent window not responding error."""
    for _ in range(30):
        try:
            res = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=0.2)
            if res.status == 200:
                return True
        except Exception:
            pass
        time.sleep(0.1)
    return False


def start_global_hotkey_listener():
    """
    Registers GLOBAL OS-level hotkeys (Ctrl + \\ and Alt + H) that work even when the
    native window is completely hidden via SW_HIDE. When either hotkey fires,
    it calls /api/window/toggle to show/hide the AVAI window.

    Uses Win32 RegisterHotKey + GetMessage loop on a dedicated thread.
    """
    try:
        user32 = ctypes.windll.user32

        # Hotkey constants
        MOD_ALT = 0x0001
        MOD_CONTROL = 0x0002
        VK_OEM_5 = 0xDC  # The backslash \ key
        VK_H = ord('H')

        HOTKEY_ID_CTRL_BACKSLASH = 9001
        HOTKEY_ID_ALT_H = 9002

        # Register Ctrl + Backslash as a global hotkey
        user32.RegisterHotKey(None, HOTKEY_ID_CTRL_BACKSLASH, MOD_CONTROL, VK_OEM_5)
        # Register Alt + H as a backup global hotkey
        user32.RegisterHotKey(None, HOTKEY_ID_ALT_H, MOD_ALT, VK_H)

        # GetMessage loop — blocks until a hotkey message arrives
        msg = ctypes.wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) != 0:
            if msg.message == 0x0312:  # WM_HOTKEY
                if msg.wParam in (HOTKEY_ID_CTRL_BACKSLASH, HOTKEY_ID_ALT_H):
                    try:
                        req = urllib.request.Request(
                            "http://127.0.0.1:8000/api/window/toggle",
                            data=b"",
                            headers={"Content-Type": "application/json"},
                            method="POST",
                        )
                        urllib.request.urlopen(req, timeout=1)
                    except Exception:
                        pass

        user32.UnregisterHotKey(None, HOTKEY_ID_CTRL_BACKSLASH)
        user32.UnregisterHotKey(None, HOTKEY_ID_ALT_H)
    except Exception:
        pass


def main():
    # 1. Start FastAPI backend thread
    threading.Thread(target=start_backend, daemon=True).start()

    # 2. Wait until server is online before initializing native window
    wait_for_server()

    # 3. Start global hotkey listener thread (Ctrl + \ works even when window is hidden)
    threading.Thread(target=start_global_hotkey_listener, daemon=True).start()

    # 4. Launch PyWebView Native Window with easy_drag=True
    try:
        import webview

        webview.create_window(
            title="AVAI - Stealth Interview Assistant",
            url="http://127.0.0.1:8000",
            width=540,
            height=820,
            on_top=True,
            resizable=True,
            easy_drag=True,
            background_color='#090d16',
        )

        def apply_stealth_loop():
            for _ in range(15):
                time.sleep(0.8)
                find_and_protect_windows("AVAI")

        threading.Thread(target=apply_stealth_loop, daemon=True).start()
        webview.start()

    except Exception:
        import webbrowser
        webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    main()
