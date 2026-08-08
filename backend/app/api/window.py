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
    """Completely hide the native OS window using ShowWindow(SW_HIDE).
    Leaves zero popups, zero snippets, and zero taskbar traces.
    """
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)
            # SW_HIDE = 0
            user32.ShowWindow(hwnd_int, 0)
            _last_position["hidden"] = True
            return {"status": "ok", "action": "hidden"}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/show")
async def show_native_window():
    """Show the hidden native OS window using ShowWindow(SW_SHOW)."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)
            # SW_SHOW = 5
            user32.ShowWindow(hwnd_int, 5)
            user32.SetForegroundWindow(hwnd_int)
            _last_position["hidden"] = False
            return {"status": "ok", "action": "shown"}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/toggle")
async def toggle_native_window():
    """Toggle native OS window visibility: Hide if visible, show if hidden."""
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)
            # If window is visible, hide it. Otherwise show it.
            if user32.IsWindowVisible(hwnd_int):
                return await hide_native_window()
            else:
                return await show_native_window()
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


class OpacityRequest(BaseModel):
    opacity: int  # 0 (fully transparent) to 100 (fully opaque)


@router.post("/opacity")
async def set_native_window_opacity(req: OpacityRequest):
    """Set native OS window transparency using Win32 SetLayeredWindowAttributes.

    opacity: 0 = fully transparent, 100 = fully opaque
    """
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)

            GWL_EXSTYLE = -20
            WS_EX_LAYERED = 0x00080000
            LWA_ALPHA = 0x00000002
            SWP_NOMOVE = 0x0002
            SWP_NOSIZE = 0x0001
            SWP_NOZORDER = 0x0004
            SWP_FRAMECHANGED = 0x0020

            # Step 1: Enable WS_EX_LAYERED extended style on the window
            current_style = user32.GetWindowLongW(hwnd_int, GWL_EXSTYLE)
            if not (current_style & WS_EX_LAYERED):
                user32.SetWindowLongW(hwnd_int, GWL_EXSTYLE, current_style | WS_EX_LAYERED)
                user32.SetWindowPos(
                    hwnd_int, 0, 0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED
                )

            # Step 2: Set alpha value (0-255)
            alpha_byte = max(15, min(255, int(req.opacity * 255 / 100)))
            user32.SetLayeredWindowAttributes(hwnd_int, 0, alpha_byte, LWA_ALPHA)

            return {"status": "ok", "opacity": req.opacity, "alpha_byte": alpha_byte}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/status")
async def window_status():
    """Returns current window visibility state."""
    return {"hidden": _last_position.get("hidden", False)}


@router.post("/screenshot")
async def capture_screenshot():
    """Capture the current screen automatically with sub-second latency.

    1. Hides the AVAI window completely using SW_HIDE (no popups).
    2. Captures primary monitor using PIL.ImageGrab.
    3. Restores the AVAI window immediately using SW_SHOW.
    4. Downscales to max 1600px and compresses to JPEG (quality 75).
    5. Returns base64 JPEG data URL.
    """
    try:
        import ctypes
        import time
        import base64
        import io
        from PIL import ImageGrab

        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        was_visible = False

        # Step 1: Hide our window completely so it doesn't show in screenshot or pop up
        if hwnd:
            hwnd_int = int(hwnd)
            if user32.IsWindowVisible(hwnd_int):
                was_visible = True
                user32.ShowWindow(hwnd_int, 0)  # SW_HIDE
                time.sleep(0.04)  # Minimal wait for window manager

        # Step 2: Ultra-fast screen grab
        img = ImageGrab.grab()

        # Step 3: Restore our window IMMEDIATELY
        if was_visible and hwnd:
            hwnd_int = int(hwnd)
            user32.ShowWindow(hwnd_int, 5)  # SW_SHOW
            user32.SetForegroundWindow(hwnd_int)

        # Step 4: Downscale & compress to JPEG in memory (lightweight ~150KB payload)
        img.thumbnail((1600, 1600))
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=75, optimize=True)
        b64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_data}"

        return {"status": "ok", "image": data_url}

    except Exception as e:
        try:
            if hwnd:
                hwnd_int = int(hwnd)
                user32.ShowWindow(hwnd_int, 5)
                user32.SetForegroundWindow(hwnd_int)
        except Exception:
            pass
        return {"status": "error", "message": str(e)}


@router.post("/close")
async def close_native_window():
    """Exit and terminate the native OS application process."""
    try:
        import os
        import time
        import ctypes
        import threading

        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            # Send WM_CLOSE message (0x0010)
            user32.PostMessageW(int(hwnd), 0x0010, 0, 0)
        
        # Force process termination after 0.2s
        threading.Thread(target=lambda: (time.sleep(0.2), os._exit(0)), daemon=True).start()
        return {"status": "ok", "action": "closing"}
    except Exception:
        import os
        os._exit(0)
