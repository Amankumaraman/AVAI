import platform
import threading
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/window", tags=["Window"])

# Store last known position so we can restore after hiding
_last_position = {"x": None, "y": None, "hidden": False}


class MoveWindowRequest(BaseModel):
    dx: int
    dy: int


def find_avai_window_hwnd():
    """Find the native Windows hwnd for the AVAI window.
    Searches both visible AND hidden windows so we can show a hidden window.
    """
    import ctypes
    import ctypes.wintypes

    user32 = ctypes.windll.user32
    EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    matching_hwnds = []

    def enum_cb(hwnd, lparam):
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            if "avai" in buff.value.lower():
                matching_hwnds.append(hwnd)
        return True

    user32.EnumWindows(EnumWindowsProc(enum_cb), 0)
    return matching_hwnds[0] if matching_hwnds else None


@router.post("/move")
async def move_native_window(req: MoveWindowRequest):
    """Move the native OS window by dx, dy pixels."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Window movement only supported on Windows"}

    try:
        import ctypes
        import ctypes.wintypes

        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            rect = ctypes.wintypes.RECT()
            user32.GetWindowRect(int(hwnd), ctypes.byref(rect))
            new_x = rect.left + req.dx
            new_y = rect.top + req.dy
            # SWP_NOSIZE = 0x0001, SWP_NOZORDER = 0x0004, SWP_NOACTIVATE = 0x0010
            user32.SetWindowPos(int(hwnd), 0, int(new_x), int(new_y), 0, 0, 0x0001 | 0x0004 | 0x0010)
            return {"status": "ok", "x": new_x, "y": new_y}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/hide")
async def hide_native_window():
    """Minimize the native OS window using ShowWindow(SW_MINIMIZE)."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            # SW_MINIMIZE = 6
            user32.ShowWindow(int(hwnd), 6)
            return {"status": "ok", "action": "minimized"}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/show")
async def show_native_window():
    """Restore the native OS window using ShowWindow(SW_RESTORE)."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)
            # SW_RESTORE = 9
            user32.ShowWindow(hwnd_int, 9)
            user32.SetForegroundWindow(hwnd_int)
            return {"status": "ok", "action": "restored"}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/toggle")
async def toggle_native_window():
    """Toggle native OS window visibility: Minimize if restored, restore if minimized."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)
            # Check if minimized
            if user32.IsIconic(hwnd_int):
                # SW_RESTORE = 9
                user32.ShowWindow(hwnd_int, 9)
                user32.SetForegroundWindow(hwnd_int)
                return {"status": "ok", "action": "restored"}
            else:
                # SW_MINIMIZE = 6
                user32.ShowWindow(hwnd_int, 6)
                return {"status": "ok", "action": "minimized"}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


class OpacityRequest(BaseModel):
    opacity: int  # 0 (fully transparent) to 100 (fully opaque)


@router.post("/opacity")
async def set_native_window_opacity(req: OpacityRequest):
    """Update window opacity setting.
    
    Transparency is handled natively by PyWebView (transparent=True)
    and CSS rgba background values without Win32 GDI SetLayeredWindowAttributes
    which corrupts WebView2 DirectComposition swapchains.
    """
    return {"status": "ok", "opacity": req.opacity}


@router.get("/status")
async def window_status():
    """Returns current window visibility state."""
    return {"hidden": _last_position.get("hidden", False)}


@router.post("/screenshot")
async def capture_screenshot():
    """Capture the current screen automatically.

    1. Minimizes the AVAI window so it doesn't appear in the screenshot.
    2. Captures the entire primary monitor using mss.
    3. Restores the AVAI window cleanly.
    4. Returns the screenshot as a base64 JPEG data URL.
    """
    try:
        import ctypes
        import time
        import base64
        import mss
        import mss.tools

        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        was_visible = False

        # Step 1: Minimize our window so it doesn't show in the screenshot
        if hwnd:
            hwnd_int = int(hwnd)
            if not user32.IsIconic(hwnd_int):
                was_visible = True
                user32.ShowWindow(hwnd_int, 6)  # SW_MINIMIZE
                time.sleep(0.2)  # Wait for minimize animation

        # Step 2: Capture the primary monitor
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            screenshot = sct.grab(monitor)
            png_bytes = mss.tools.to_png(screenshot.rgb, screenshot.size)
            b64_data = base64.b64encode(png_bytes).decode("utf-8")
            data_url = f"data:image/png;base64,{b64_data}"

        # Step 3: Restore our window cleanly
        if was_visible and hwnd:
            hwnd_int = int(hwnd)
            user32.ShowWindow(hwnd_int, 9)  # SW_RESTORE
            user32.SetForegroundWindow(hwnd_int)

        return {"status": "ok", "image": data_url}

    except Exception as e:
        # Attempt to restore window even on error
        try:
            if hwnd:
                hwnd_int = int(hwnd)
                user32.ShowWindow(hwnd_int, 9)
                user32.SetForegroundWindow(hwnd_int)
        except Exception:
            pass
        return {"status": "error", "message": str(e)}
