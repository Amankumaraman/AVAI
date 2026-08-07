from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
from app.config import DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT


class MessageContentText(BaseModel):
    type: str = "text"
    text: str


class ImageUrlDetail(BaseModel):
    url: str


class MessageContentImage(BaseModel):
    type: str = "image_url"
    image_url: ImageUrlDetail


ChatMessageContent = Union[str, List[Union[MessageContentText, MessageContentImage, Dict[str, Any]]]]


class ChatMessage(BaseModel):
    role: str
    content: ChatMessageContent


class ChatRequest(BaseModel):
    model: Optional[str] = DEFAULT_MODEL
    messages: List[ChatMessage]
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT
    answer_mode: Optional[str] = "verbal"  # "verbal" or "code"
    tech_role: Optional[str] = "backend"   # "backend", "frontend", "data", "devops", "general"
    stream: Optional[bool] = False
    api_key: Optional[str] = None


class VisionRequest(BaseModel):
    model: Optional[str] = DEFAULT_MODEL
    prompt: Optional[str] = "Analyze this image and answer in a crisp, interview-acceptable style."
    image_data: str  # Base64 string or data URL
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT
    answer_mode: Optional[str] = "verbal"
    tech_role: Optional[str] = "backend"
    api_key: Optional[str] = None


class VoiceRequest(BaseModel):
    transcript: str
    messages: Optional[List[ChatMessage]] = Field(default_factory=list)
    model: Optional[str] = DEFAULT_MODEL
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT
    answer_mode: Optional[str] = "verbal"
    tech_role: Optional[str] = "backend"
    api_key: Optional[str] = None


class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    model: str
    finish_reason: Optional[str] = "stop"


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    supports_vision: bool
    context_length: int
    is_free: bool
