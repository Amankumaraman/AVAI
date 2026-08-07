from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.models.schemas import VisionRequest, ChatResponse
from app.services.openrouter import openrouter_service

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

    formatted_messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": request.prompt or "Analyze this image and describe what you see."},
                {"type": "image_url", "image_url": {"url": image_url_str}},
            ],
        }
    ]

    res = await openrouter_service.chat_completion(
        messages=formatted_messages,
        model=request.model,
        system_prompt=request.system_prompt,
        user_api_key=api_key,
    )

    return ChatResponse(
        role=res["role"],
        content=res["content"],
        model=res["model"],
        finish_reason=res["finish_reason"],
    )
