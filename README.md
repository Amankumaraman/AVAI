# AVAI - Stealth Interview Assistant

AVAI is a premium, ultra-stealth multimodal AI desktop assistant designed to assist with technical interviews in real-time. Built using **FastAPI**, **Vite/React**, and **PyWebView**, it runs on Windows as a high-performance native desktop window featuring custom transparency, click-through overlay states, global OS hotkeys, and screen-sharing invisibility.

---

## ✨ Features

- **📺 Invisibility on Screen Shares**: Automatically applies `WDA_EXCLUDEFROMCAPTURE` to the desktop container, rendering it completely invisible to Google Meet, Zoom, MS Teams, and Discord screen shares.
- **🔇 Muted TTS Audio**: Speech responses are hard-muted across all hooks to prevent interviewers from hearing any audio coming from the app.
- **🎛️ Keyboard & Window Control**:
  - `Ctrl + ArrowKeys` - Slide the actual native Windows OS window across your monitors.
  - `Ctrl + \` or `Alt + H` - Minimize the entire desktop window instantly (press again system-wide to restore it).
  - `Ctrl + [` / `Ctrl + ]` - Instantly navigate prior answer pages.
- **📸 On-Demand Screen Analysis**: No automatic captures. Trigger snapshot captures only when needed using the **⚡ Analyze Screen** button or `Ctrl + Enter`.
- **🎚️ Dynamic Opacity**: Control the background transparency of both the inner React UI and the outer physical window frame using a slider in the settings panel (saved permanently to `localStorage`).
- **💡 Answer Modes & Presets**: Toggle between **Verbal Pointers** (3-4 spoken bullet points) and **Deep Code** modes, and select custom role presets (Frontend, Backend, Fullstack, DevOps).

---

## 🛠️ Tech Stack

- **Frontend**: Vite, React, TypeScript, CSS Variables
- **Backend**: FastAPI, Uvicorn, Python `ctypes` (Win32 APIs)
- **Runtime**: PyWebView (wrapper around Microsoft Edge WebView2 runtime)
- **AI Models**: OpenRouter API (Gemma 3, Llama 3.3, Qwen 2.5 Coder, Gemini 2.0, DeepSeek R1)

---

## 🚀 Quick Start

### Prerequisites
- Windows OS (for Win32 window APIs and global hotkeys)
- Python 3.10+
- Node.js 18+

### Setup & Run
1. Double-click `Install_Desktop_Shortcut.bat` to create an **AVAI Assistant** shortcut on your Desktop.
2. Double-click `Start_AVAI.bat` (or use the shortcut) to run the detached silent FastAPI backend and native desktop client.

---

## 📄 License
This project is licensed under the MIT License.
