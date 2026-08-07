from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from app.models.schemas import ChatRequest, ChatResponse
from app.services.openrouter import openrouter_service
from app.config import DEFAULT_SYSTEM_PROMPT

router = APIRouter(prefix="/api", tags=["Chat"])


def build_custom_system_prompt(base_prompt: str, answer_mode: str = "verbal", tech_role: str = "backend") -> str:
    role_contexts = {
        "backend": "Focus on backend architecture, databases (SQL/NoSQL), REST/gRPC APIs, concurrency, and scalable system design in Python/Go/Node.",
        "frontend": "Focus on modern frontend engineering, React/Next.js, state management, DOM performance, CSS/UI layout, and web performance.",
        "data": "Focus on data science, machine learning algorithms, SQL data pipelines, pandas/numpy, model optimization, and statistics.",
        "devops": "Focus on DevOps, Docker/Kubernetes, CI/CD pipelines, AWS/GCP cloud infrastructure, terraform, and Linux networking.",
        "general": "Focus on general software engineering, data structures & algorithms, and behavioral interview principles.",
    }

    context_addon = role_contexts.get(tech_role, role_contexts["backend"])

    if answer_mode == "code":
        mode_addon = (
            "\n\nDEEP CODE MODE ACTIVE:\n"
            "1. Provide complete, working, production-ready code implementation.\n"
            "2. Include Big-O Time Complexity and Space Complexity analysis.\n"
            "3. Note key edge cases handled."
        )
    else:
        mode_addon = (
            "\n\nVERBAL POINTERS MODE ACTIVE:\n"
            "1. Give sharp 3-4 bullet point answers ready to speak out loud in an interview.\n"
            "2. DO NOT INCLUDE CODE BLOCKS OR TRIPLE BACKTICKS (` ``` `) unless explicitly requested."
        )

    return f"{base_prompt}\n\nTARGET ROLE CONTEXT:\n{context_addon}{mode_addon}"


@router.post("/chat", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
):
    api_key = request.api_key or x_openrouter_api_key

    sys_prompt = build_custom_system_prompt(
        request.system_prompt or DEFAULT_SYSTEM_PROMPT,
        answer_mode=request.answer_mode or "verbal",
        tech_role=request.tech_role or "backend",
    )

    # Convert Pydantic messages to dict
    formatted_messages = []
    for msg in request.messages:
        formatted_messages.append({"role": msg.role, "content": msg.content})

    if request.stream:
        return StreamingResponse(
            openrouter_service.chat_completion_stream(
                messages=formatted_messages,
                model=request.model,
                system_prompt=sys_prompt,
                user_api_key=api_key,
            ),
            media_type="text/event-stream",
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
