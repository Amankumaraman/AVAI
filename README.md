# AVAI - Multimodal AI Student Study Companion

AVAI is a high-performance student study assistant and focus companion. Designed for classrooms, study halls, and libraries, it helps students capture slide contents, solve complex homework equations, summarize programming examples, and retrieve study guidance in real-time.

Built using **FastAPI**, **Vite/React**, and **PyWebView**, it runs on Windows as a native desktop utility featuring customized transparency, presenter-friendly overlay exclusions, and system hotkeys.

---

## ✨ Features

- **📺 Presenter-Friendly Overlay Exclusions**: Automatically excludes the helper interface from screen-sharing captures (`WDA_EXCLUDEFROMCAPTURE`) so it won't distract others during live presentation slides on Zoom or Google Meet.
- **🔇 Silent Library Mode**: Speech synthesis is hard-muted across all modules, ensuring quiet and distraction-free operation in libraries, classrooms, and study spaces.
- **🎛️ Keyboard & Window Control**:
  - `Ctrl + ArrowKeys` - Smoothly reposition the floating utility window across your desktop/monitors.
  - `Ctrl + \` or `Alt + H` - Minimize the companion app instantly (press again system-wide to restore it).
  - `Ctrl + [` / `Ctrl + ]` - Navigate backward and forward through prior notes pages.
- **📸 Slide & Text Capture**: Capture slide segments or equations on-demand only (via **⚡ Analyze Screen** or `Ctrl + Enter`) to query explanations.
- **🎚️ Customized Transparency**: Adjust the window background opacity of the UI and host frame using a settings slider (persisted to local settings) to blend with your lecture notes.
- **💡 Study Modes & Presets**: Toggle between **Verbal Pointers** (crisp, easy-to-read concepts) and **Deep Code** (comprehensive logic breakdowns) modes.

---

## 🛠️ Tech Stack

- **Frontend**: Vite, React, TypeScript, CSS Variables
- **Backend**: FastAPI, Uvicorn, Python `ctypes` (Win32 APIs)
- **Runtime**: PyWebView (wrapper around Microsoft Edge WebView2 runtime)
- **AI Models**: OpenRouter API (Gemma 3, Llama 3.3, Qwen 2.5 Coder, Gemini 2.0, DeepSeek R1)

---

## 🚀 Setup & Run

### Prerequisites
- Windows OS (for Win32 window APIs and global hotkeys)
- Python 3.10+
- Node.js 18+

### Setup & Run
1. Run `Install_Desktop_Shortcut.bat` to create an **AVAI Assistant** shortcut on your Desktop.
2. Double-click `Start_AVAI.bat` (or use the shortcut) to run the detached silent FastAPI backend and native desktop client.

---

## 📄 License
This project is licensed under the MIT License.
