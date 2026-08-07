import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api import chat, vision, voice, models, window
from app.config import HOST, PORT

app = FastAPI(
    title="Multimodal AI Voice Assistant API",
    description="FastAPI Backend powered by OpenRouter API, Web Speech integration, and Vision models.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers (Must be registered BEFORE catch-all static route)
app.include_router(chat.router)
app.include_router(vision.router)
app.include_router(voice.router)
app.include_router(models.router)
app.include_router(window.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "Multimodal AI Voice Assistant Backend",
        "version": "1.0.0",
    }


# Mount Frontend Production Build Static Assets if dist folder exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.api_route("/{full_path:path}", methods=["GET", "HEAD"], tags=["Frontend"])
async def serve_frontend(full_path: str):
    target_file = os.path.join(frontend_dist, full_path)
    if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
        return FileResponse(target_file)
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "AVAI Backend is active. Run 'npm run build' in frontend/ to build production UI."}


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
