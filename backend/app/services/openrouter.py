import httpx
import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from fastapi import HTTPException
from app.config import get_api_key, get_groq_api_key, OPENROUTER_BASE_URL, GROQ_BASE_URL, DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT
from app.models.schemas import ChatMessage


class OpenRouterService:
    def __init__(self):
        self.base_url = OPENROUTER_BASE_URL

    def _get_headers(self, user_api_key: Optional[str] = None) -> Dict[str, str]:
        key = (user_api_key and user_api_key.strip()) or get_api_key()
        if not key:
            raise HTTPException(
                status_code=401,
                detail="Missing OpenRouter API Key. Please add your key to backend/.env or enter it in the UI Settings modal.",
            )

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "http://localhost:5173",  # OpenRouter ranking inclusion
            "X-Title": "Multimodal AI Voice Assistant",
        }
        return headers

    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        formatted_messages = []
        if sys_prompt:
            formatted_messages.append({"role": "system", "content": sys_prompt})
        formatted_messages.extend(messages)

        # ⚡ Groq LPU API Acceleration (sub-300ms inference)
        groq_key = (user_api_key and user_api_key.startswith("gsk_") and user_api_key) or get_groq_api_key()
        if groq_key and groq_key.startswith("gsk_"):
            has_image = any(isinstance(m.get("content"), list) for m in messages)
            groq_model = "llama-3.2-11b-vision-preview" if has_image else "llama-3.3-70b-versatile"
            groq_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {groq_key}",
                "User-Agent": "AVAI/1.0",
            }
            groq_payload = {
                "model": groq_model,
                "messages": formatted_messages,
                "stream": False,
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                try:
                    res = await client.post(f"{GROQ_BASE_URL}/chat/completions", headers=groq_headers, json=groq_payload)
                    if res.status_code == 200:
                        data = res.json()
                        choice = data["choices"][0]
                        return {
                            "role": choice["message"]["role"],
                            "content": choice["message"]["content"],
                            "model": f"groq/{groq_model}",
                            "finish_reason": choice.get("finish_reason", "stop"),
                        }
                except Exception:
                    pass  # Fallback to OpenRouter seamlessly

        target_model = model or "google/gemma-4-26b-a4b-it:free"
        headers = self._get_headers(user_api_key)

        sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        formatted_messages = []
        if sys_prompt:
            formatted_messages.append({"role": "system", "content": sys_prompt})
        formatted_messages.extend(messages)

        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                
                if response.status_code != 200:
                    # Retry immediately with fast model
                    payload["model"] = "google/gemma-4-26b-a4b-it:free"
                    response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)

                if response.status_code != 200:
                    error_detail = response.text
                    try:
                        error_json = response.json()
                        if "error" in error_json:
                            error_detail = error_json["error"].get("message", response.text)
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenRouter API Error ({response.status_code}): {error_detail}",
                    )

                data = response.json()
                choice = data["choices"][0]
                content_text = choice["message"]["content"]

                # Fallback check: If the returned model output is just "User Safety: safe" or a safety filter classification, retry with a fallback model
                if "User Safety:" in content_text or content_text.strip() == "safe" or (len(content_text.strip()) < 30 and "User Safety" in content_text):
                    fallback_models = ["google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-nano-12b-v2-vl:free", "cohere/north-mini-code:free"]
                    for fb_model in fallback_models:
                        if fb_model != target_model:
                            payload["model"] = fb_model
                            try:
                                fb_res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                                if fb_res.status_code == 200:
                                    fb_data = fb_res.json()
                                    fb_content = fb_data["choices"][0]["message"]["content"]
                                    if "User Safety:" not in fb_content and len(fb_content.strip()) > 15:
                                        return {
                                            "role": "assistant",
                                            "content": fb_content,
                                            "model": fb_data.get("model", fb_model),
                                            "finish_reason": "stop",
                                        }
                            except Exception:
                                pass

                return {
                    "role": choice["message"]["role"],
                    "content": content_text,
                    "model": data.get("model", target_model),
                    "finish_reason": choice.get("finish_reason", "stop"),
                }
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=f"Network error connecting to OpenRouter: {str(exc)}",
                )

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        user_api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        target_model = model or DEFAULT_MODEL
        headers = self._get_headers(user_api_key)

        sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        formatted_messages = []
        if sys_prompt:
            formatted_messages.append({"role": "system", "content": sys_prompt})
        formatted_messages.extend(messages)

        payload = {
            "model": target_model,
            "messages": formatted_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield f"data: {json.dumps({'error': error_text.decode('utf-8')})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        yield f"{line}\n\n"


openrouter_service = OpenRouterService()
