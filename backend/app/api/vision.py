from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.models.schemas import VisionRequest, ChatResponse
from app.services.openrouter import openrouter_service
from app.api.chat import build_custom_system_prompt
from app.config import DEFAULT_SYSTEM_PROMPT

router = APIRouter(prefix="/api", tags=["Vision"])


@router.post("/vision", response_model=ChatResponse)
async def handle_vision(
    request: VisionRequest,
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
):
    api_key = request.api_key or x_openrouter_api_key
    image_url_str = request.image_data

    # Format base64 string if it doesn't already start with data:image/
    if not image_url_str.startswith("data:") and not image_url_str.startswith("http"):
        image_url_str = f"data:image/jpeg;base64,{image_url_str}"

    default_coding_prompt = (
        "Identify and solve the coding problem or task shown on this screen capture. "
        "Provide the COMPLETE, OPTIMAL SOLUTION CODE in markdown code blocks (e.g. ```python, ```cpp, ```java, ```javascript) "
        "along with Big-O Time & Space Complexity analysis."
    )

    formatted_messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": request.prompt or default_coding_prompt},
                {"type": "image_url", "image_url": {"url": image_url_str}},
            ],
        }
    ]

    sys_prompt = build_custom_system_prompt(
        request.system_prompt or DEFAULT_SYSTEM_PROMPT,
        answer_mode=request.answer_mode or "code",
        tech_role=request.tech_role or "backend",
        has_image=True,
    )

    res = await openrouter_service.chat_completion(
        messages=formatted_messages,
        model=request.model,
        system_prompt=sys_prompt,
        user_api_key=api_key,
    )

    return ChatResponse(
        role=res["role"],
        content=res["content"],
        model=res["model"],
        finish_reason=res["finish_reason"],
    )
