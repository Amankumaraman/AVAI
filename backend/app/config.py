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


DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "google/gemma-4-26b-a4b-it:free")
DEFAULT_SYSTEM_PROMPT = (
    "You are an elite AI technical coach and problem-solving assistant.\n"
    "CODING PROBLEM & SCREEN ANALYSIS RULES:\n"
    "1. Whenever a screen capture, LeetCode problem, or coding task is provided, IMMEDIATELY output the COMPLETE, OPTIMAL, PRODUCTION-READY SOLUTION CODE in standard markdown code blocks (e.g. ```python, ```cpp, ```java, ```javascript).\n"
    "2. Always include Big-O Time Complexity and Space Complexity analysis.\n"
    "3. Provide a brief 2-3 sentence overview of the algorithmic approach and key edge cases handled."
)

def get_groq_api_key() -> str:
    """Dynamically get Groq API key from .env."""
    load_dotenv(dotenv_path=env_path, override=True)
    return os.getenv("GROQ_API_KEY", "").strip()


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
