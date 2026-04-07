import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import (
    admin_users,
    alertas,
    auth,
    camara,
    chat,
    correctivo,
    dashboard,
    diagnostico,
    equipos,
    historial,
    preventivo,
)

load_dotenv()
init_db()


def _cors_origins() -> list[str]:
    """CORS_ORIGINS=comma,separated o * (solo si no usas cookies; JWT en header suele ir bien)."""
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if raw == "*":
        return ["*"]
    if raw:
        return [x.strip() for x in raw.split(",") if x.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


_origins = _cors_origins()
_allow_all = _origins == ["*"]

app = FastAPI(
    title=os.getenv("ASSISTANT_NAME", "Amelia") + " API",
    version="1.0",
    description=os.getenv("COMPANY_NAME", "Central de Aires del Pacífico"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=not _allow_all,
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(equipos.router, prefix="/equipos", tags=["Equipos"])
app.include_router(diagnostico.router, prefix="/diagnostico", tags=["Diagnóstico"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(camara.router, prefix="/camara", tags=["Cámara"])
app.include_router(preventivo.router, prefix="/preventivo", tags=["Preventivo"])
app.include_router(correctivo.router, prefix="/correctivo", tags=["Correctivo"])
app.include_router(historial.router, prefix="/historial", tags=["Historial"])
app.include_router(alertas.router, prefix="/alertas", tags=["Alertas"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(admin_users.router, prefix="/admin", tags=["Admin"])


@app.get("/")
def root():
    return {
        "status": "ok",
        "assistant": os.getenv("ASSISTANT_NAME", "Amelia"),
        "company": os.getenv("COMPANY_NAME", "Central de Aires del Pacífico"),
    }


@app.get("/health")
def health():
    """Para health checks de Render / otros PaaS."""
    return {"status": "ok", "ok": True}
