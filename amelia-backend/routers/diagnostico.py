from __future__ import annotations

import json
import os
import unicodedata
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db, model_to_dict
from deps import get_current_user_id
from models import Equipo, Mantenimiento, Usuario

router = APIRouter()
_client: OpenAI | None = None

_DATA = Path(__file__).resolve().parent.parent / "data" / "fallas.json"
with open(_DATA, encoding="utf-8") as f:
    FALLAS: dict = json.load(f)


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY no configurada")
        _client = OpenAI(api_key=key)
    return _client


class DiagRequest(BaseModel):
    equipo: str
    problema: str


class GuardarRequest(BaseModel):
    equipo_id: int
    problema: str
    diagnostico: str
    solucion: str = ""
    fecha: str = ""
    riesgo: str = ""
    tiempo_estimado: str = ""
    tecnico: str = ""


SYSTEM_DIAG = (
    "Eres Amelia, experta en mantenimiento de aires acondicionados.\n"
    "Responde solo con: 🔍 CAUSAS (máx 5), 🔧 PASOS (máx 4), 🛠️ HERRAMIENTAS. Sin texto extra."
)


def _sin_acentos(s: str) -> str:
    return "".join(
        c
        for c in unicodedata.normalize("NFD", s.lower())
        if unicodedata.category(c) != "Mn"
    )


def buscar_en_cache(problema: str) -> dict | None:
    p = _sin_acentos(problema)
    for clave, datos in FALLAS.items():
        if _sin_acentos(clave) in p:
            return datos
    return None


@router.post("/generar")
async def generar_diagnostico(req: DiagRequest):
    cache = buscar_en_cache(req.problema)
    if cache:
        texto = "🔍 POSIBLES CAUSAS:\n"
        for i, c in enumerate(cache["causas"], 1):
            texto += f"{i}. {c}\n"
        texto += "\n🔧 PASOS DE VERIFICACIÓN:\n"
        for i, paso in enumerate(cache["pasos"], 1):
            texto += f"{i}. {paso}\n"
        texto += "\n🛠️ HERRAMIENTAS:\n"
        for h in cache["herramientas"]:
            texto += f"• {h}\n"
        return {"diagnostico": texto, "fuente": "cache"}

    client = _get_client()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=600,
        temperature=0.3,
        messages=[
            {"role": "system", "content": SYSTEM_DIAG},
            {
                "role": "user",
                "content": f"Equipo: {req.equipo}\nProblema: {req.problema}",
            },
        ],
    )
    return {
        "diagnostico": resp.choices[0].message.content or "",
        "fuente": "openai",
        "tokens_usados": resp.usage.total_tokens if resp.usage else None,
    }


@router.post("/guardar")
async def guardar_mantenimiento(
    req: GuardarRequest,
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    eq = (
        db.execute(select(Equipo).where(Equipo.id == req.equipo_id, Equipo.usuario_id == uid))
        .scalars()
        .first()
    )
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")

    nombre_snap = eq.nombre
    urow = db.get(Usuario, uid)
    tecnico = (req.tecnico or "").strip() or (urow.nombre if urow else "")

    m = Mantenimiento(
        equipo_id=req.equipo_id,
        usuario_id=uid,
        equipo=nombre_snap,
        sintoma=req.problema.strip(),
        problema=req.problema.strip(),
        tecnico=tecnico,
        fecha=req.fecha.strip() or None,
        diagnostico=req.diagnostico,
        solucion=req.solucion.strip(),
        estado="completado",
        riesgo=req.riesgo.strip() or None,
        tiempo_estimado=req.tiempo_estimado.strip() or None,
    )
    db.add(m)
    db.commit()
    return {"ok": True}


@router.get("/historial")
async def historial(
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    equipo_id: int | None = Query(None),
):
    stmt = (
        select(Mantenimiento, Equipo.nombre, Equipo.tipo, Equipo.ubicacion)
        .outerjoin(Equipo, Mantenimiento.equipo_id == Equipo.id)
        .where(Mantenimiento.usuario_id == uid)
    )
    if equipo_id is not None:
        stmt = stmt.where(Mantenimiento.equipo_id == equipo_id)
    stmt = stmt.order_by(Mantenimiento.id.desc())
    rows = db.execute(stmt).all()
    out: list[dict] = []
    for m, en, et, eu in rows:
        d = model_to_dict(m)
        d["equipo_nombre"] = en
        d["equipo_tipo"] = et
        d["equipo_ubicacion"] = eu
        out.append(d)
    return out
