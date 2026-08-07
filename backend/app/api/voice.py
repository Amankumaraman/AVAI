from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.models.schemas import VoiceRequest, ChatResponse
from app.services.openrouter import openrouter_service

router = APIRouter(prefix="/api", tags=["Voice"])


@router.post("/voice", response_model=ChatResponse)
async def handle_voice(
    request: VoiceRequest,
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
):
    api_key = request.api_key or x_openrouter_api_key

    messages = []
    if request.messages:
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

    # Append current transcribed user input
    messages.append({"role": "user", "content": request.transcript})

    res = await openrouter_service.chat_completion(
        messages=messages,
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
