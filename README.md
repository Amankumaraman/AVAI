# 🤖 AVAI — Stealth AI Assistant for Windows

AVAI is a high-performance, stealth AI study & focus assistant built for Windows. Designed for technical interviews, LeetCode problem solving, and exams, it features sub-100ms screen analysis, borderless floating widget, and **100% screen-share invisibility** (Google Meet, Zoom, Microsoft Teams).

---

## 🌐 Live Product Website & Deployment

- 🌐 **Live Website (Vercel)**: [https://avai-gilt.vercel.app/](https://avai-gilt.vercel.app/)
- 📦 **Direct Executable Installer (Supabase Cloud)**: [Download AVAI_Setup_v1.0.exe](https://logqkleznefvwxngpbcs.supabase.co/storage/v1/object/public/app-downloads/AVAI_Setup_v1.0.exe)
- 💳 **Razorpay Payment Gateway Integration**: ₹500 INR Lifetime Access Pass (No monthly subscription)
- 🐙 **GitHub Repository**: [https://github.com/Amankumaraman/AVAI](https://github.com/Amankumaraman/AVAI)

---

## ✨ Key Features

- 🥷 **100% Screen Share Invisibility**: Uses native Win32 `WDA_EXCLUDEFROMCAPTURE` display affinity so the floating widget is completely hidden from Google Meet, Zoom, Teams, and Discord screen shares.
- ⚡ **Sub-100ms Screen Analysis**: Captures LeetCode, HackerRank, or exam screens instantly and outputs optimal solution code with Big-O Time & Space Complexity analysis.
- ⚡ **Groq LPU Acceleration**: Sub-200ms model responses using Meta `llama-3.3-70b-versatile` & Google `gemma-4-26b`.
- ⌨️ **Global OS Hotkeys**: Toggle window stealth visibility from anywhere on Windows using `Ctrl + \` or `Alt + H`.
- 📅 **Date-Wise Saved Responses**: Local chat & solution history automatically organized date-wise in Settings with timestamps.
- 🎙️ **Auto Microphone Access**: Pre-granted Chromium WebView2 media stream permissions (`--use-fake-ui-for-media-stream`) with zero browser prompts.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Glassmorphism CSS
- **Website & Vercel API**: React Landing Page + Vercel Serverless Functions (`/api/create-order.ts`, `/api/verify-payment.ts`)
- **Backend Engine**: FastAPI, Uvicorn, Python `ctypes` (Win32 APIs), MSS Screen Capture, Razorpay SDK
- **Runtime**: Native Edge WebView2 Runtime (`stealth_launcher.py` with `WS_EX_TOOLWINDOW`)
- **Cloud Storage**: Supabase Storage for hosting release installer setup (`AVAI_Setup_v1.0.exe`)

---

## 🚀 Build & Install Instructions

### 1. Run App Locally
Double-click `Start_AVAI.bat` (or `Install_Desktop_Shortcut.bat`) to launch the stealth backend and desktop widget.

### 2. Build Windows Setup Executable (.exe)
Double-click `build_installer.bat` to run the automated build pipeline:
1. Builds React production static bundle (`frontend/dist`)
2. Packages Python backend via PyInstaller (`backend/AVAI_Backend.spec`)
3. Compiles Inno Setup installer (`AVAI_Installer.iss` -> `installer_dist/AVAI_Setup_v1.0.exe`)

---

## 📄 License
Licensed under the MIT License.
