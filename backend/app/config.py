import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from root backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


def get_api_key() -> str:
    """Dynamically get the API key, re-reading .env if needed."""
    load_dotenv(dotenv_path=env_path, override=True)
    return os.getenv("OPENROUTER_API_KEY", "").strip()


DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openrouter/free")
DEFAULT_SYSTEM_PROMPT = (
    "You are an elite technical interview coach providing real-time interview answers.\n"
    "STRICT INTERVIEW ANSWER RULES:\n"
    "1. Give sharp, concise bullet-point answers ('pointers') ready to speak directly in an interview.\n"
    "2. Structure every answer as follows:\n"
    "   - **TL;DR Summary** (1 sentence)\n"
    "   - **Key Interview Pointers** (3-4 concise bullet points)\n"
    "   - **Key Trade-off or When to Use** (1 sentence)\n"
    "3. ABSOLUTELY NO CODE BLOCKS OR TRIPLE BACKTICKS (` ``` `). Code snippets are STRICTLY FORBIDDEN unless the user explicitly asks to 'write code' or 'show code', or a screen capture of a coding problem is provided."
)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
