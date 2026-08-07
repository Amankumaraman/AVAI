from fastapi import APIRouter
from typing import List
from app.models.schemas import ModelInfo

router = APIRouter(prefix="/api", tags=["Models"])

RECOMMENDED_MODELS: List[ModelInfo] = [
    ModelInfo(
        id="openrouter/free",
        name="OpenRouter Auto (Free)",
        description="Auto-routes to the top available active free model on OpenRouter.",
        supports_vision=True,
        context_length=131072,
        is_free=True,
    ),
    ModelInfo(
        id="google/gemma-4-31b-it:free",
        name="Google Gemma 4 31B (Free)",
        description="Google's next-generation open multimodal vision & text intelligence model.",
        supports_vision=True,
        context_length=131072,
        is_free=True,
    ),
    ModelInfo(
        id="nvidia/nemotron-nano-12b-v2-vl:free",
        name="NVIDIA Nemotron 12B VL (Free)",
        description="NVIDIA specialized vision-language model for image and scene analysis.",
        supports_vision=True,
        context_length=32768,
        is_free=True,
    ),
    ModelInfo(
        id="nvidia/nemotron-3-super-120b-a12b:free",
        name="NVIDIA Nemotron 120B (Free)",
        description="High capacity reasoning model from NVIDIA.",
        supports_vision=False,
        context_length=131072,
        is_free=True,
    ),
    ModelInfo(
        id="openai/gpt-oss-20b:free",
        name="OpenAI GPT-OSS 20B (Free)",
        description="Open architecture instruction model for general conversation and code.",
        supports_vision=False,
        context_length=32768,
        is_free=True,
    ),
    ModelInfo(
        id="cohere/north-mini-code:free",
        name="Cohere North Mini Code (Free)",
        description="Specialized code generation & technical problem solving model.",
        supports_vision=False,
        context_length=32768,
        is_free=True,
    ),
]


@router.get("/models", response_model=List[ModelInfo])
async def get_models():
    return RECOMMENDED_MODELS
