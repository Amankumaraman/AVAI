from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
from app.models.schemas import ChatRequest, ChatResponse
from app.services.openrouter import openrouter_service
from app.config import DEFAULT_SYSTEM_PROMPT

router = APIRouter(prefix="/api", tags=["Chat"])


def build_custom_system_prompt(
    base_prompt: str,
    answer_mode: str = "verbal",
    tech_role: str = "backend",
    has_image: bool = False,
) -> str:
    role_contexts = {
        "backend": "Focus on backend architecture, databases (SQL/NoSQL), REST/gRPC APIs, concurrency, algorithms, and system design in Python/Go/Java/Node.",
        "frontend": "Focus on modern frontend engineering, React/Next.js, TypeScript, state management, DOM performance, CSS/UI layout, and algorithms.",
        "data": "Focus on data science, machine learning algorithms, SQL data pipelines, pandas/numpy, model optimization, and statistics.",
        "devops": "Focus on DevOps, Docker/Kubernetes, CI/CD pipelines, AWS/GCP cloud infrastructure, terraform, and Linux networking.",
        "general": "Focus on general software engineering, data structures & algorithms, and problem-solving principles.",
    }

    context_addon = role_contexts.get(tech_role, role_contexts["backend"])

    if has_image or answer_mode == "code":
        mode_addon = (
            "\n\nSOLVING CODING PROBLEM / SCREEN CAPTURE MODE ACTIVE:\n"
            "1. You MUST provide the COMPLETE, WORKING, OPTIMAL SOLUTION CODE inside standard markdown code blocks (e.g. ```python, ```cpp, ```java, ```javascript).\n"
            "2. Always analyze Big-O Time Complexity & Space Complexity.\n"
            "3. Provide a crisp 2-3 sentence overview of the algorithm before or after the code block."
        )
    else:
        mode_addon = (
            "\n\nVERBAL POINTERS MODE ACTIVE:\n"
            "1. Give sharp 3-4 bullet point answers ready to speak out loud.\n"
            "2. If a coding problem is asked, provide the solution code in a markdown code block."
        )

    return f"{base_prompt}\n\nTARGET ROLE CONTEXT:\n{context_addon}{mode_addon}"


@router.post("/chat", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    x_openrouter_api_key: Optional[str] = Header(None, alias="x-openrouter-api-key"),
):
    api_key = request.api_key or x_openrouter_api_key

    # Check if any message in request contains an image payload
    has_image = False
    for msg in request.messages:
        if isinstance(msg.content, list):
            for item in msg.content:
                if isinstance(item, dict) and (item.get("type") == "image_url" or "image_url" in item):
                    has_image = True
                    break

    sys_prompt = build_custom_system_prompt(
        request.system_prompt or DEFAULT_SYSTEM_PROMPT,
        answer_mode=request.answer_mode or "verbal",
        tech_role=request.tech_role or "backend",
        has_image=has_image,
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
