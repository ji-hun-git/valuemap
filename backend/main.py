from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes.ai import router as ai_router
from backend.routes.realtime import router as realtime_router
from backend.routes.trade_flows import router as trade_flows_router
from backend.routes.wealth_nodes import router as companies_router
from backend.safety import RateLimitMiddleware, SecurityHeadersMiddleware

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PUBLIC = ROOT / "frontend" / "public"

app = FastAPI(title="Atlas of Value API", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, requests_per_minute=180)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(companies_router)
app.include_router(trade_flows_router)
app.include_router(realtime_router)
app.include_router(ai_router)
app.mount("/static", StaticFiles(directory=FRONTEND_PUBLIC), name="static")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def web_app() -> FileResponse:
    return FileResponse(FRONTEND_PUBLIC / "index.html")
