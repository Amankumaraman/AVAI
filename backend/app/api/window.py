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
            # SW_RESTORE = 9
            user32.ShowWindow(int(hwnd), 9)
            user32.SetForegroundWindow(int(hwnd))
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
    """Set native OS window transparency using Win32 SetLayeredWindowAttributes.

    opacity: 0 = fully transparent, 100 = fully opaque
    """
    if platform.system() != "Windows":
        return {"status": "error", "message": "Only supported on Windows"}

    try:
        import ctypes
        import ctypes.wintypes

        user32 = ctypes.windll.user32
        hwnd = find_avai_window_hwnd()
        if hwnd:
            hwnd_int = int(hwnd)

            # Win32 constants
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
            # Map 0-100 percentage to 0-255 byte
            alpha_byte = max(10, min(255, int(req.opacity * 255 / 100)))
            user32.SetLayeredWindowAttributes(hwnd_int, 0, alpha_byte, LWA_ALPHA)

            return {"status": "ok", "opacity": req.opacity, "alpha_byte": alpha_byte}
        return {"status": "error", "message": "AVAI window not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/status")
async def window_status():
    """Returns current window visibility state."""
    return {"hidden": _last_position.get("hidden", False)}

