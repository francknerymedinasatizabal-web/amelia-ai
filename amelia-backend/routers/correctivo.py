from __future__ import annotations

import json
import os

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from access import get_equipo_or_404, user_may_edit_equipo
from database import get_db, model_to_dict
from deps import get_current_user, require_tecnico_or_admin
from models import Correctivo, Usuario

router = APIRouter()
_oai = None


def _client():
    global _oai
    if _oai is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise HTTPException(503, "OPENAI_API_KEY no configurada")
        _oai = OpenAI(api_key=key)
    return _oai


class DiagnosticoReq(BaseModel):
    sintomas: list[str] = Field(default_factory=list)
    descripcion: str = ""


class GuardarCorrectivo(BaseModel):
    equipo_id: int
    sintomas_json: list[str] = Field(default_factory=list)
    descripcion: str = ""
    causa: str = ""
    pasos_json: list[str] = Field(default_factory=list)
    acciones_realizadas: str = ""
    fotos_urls: list[str] = Field(default_factory=list)
    tiempo_inicio: str | None = None
    tiempo_fin: str | None = None
    duracion_minutos: float | None = None
    pdf_url: str | None = None


@router.post("/diagnostico")
def diagnostico_correctivo(
    body: DiagnosticoReq,
    user: Usuario = Depends(require_tecnico_or_admin),
):
    del user
    c = _client()
    sint = ", ".join(body.sintomas) if body.sintomas else "ninguno específico"
    prompt = (
        f"Síntomas: {sint}. Descripción: {body.descripcion}. "
        'Responde SOLO JSON: {"causa_probable": "...", "pasos": ["paso1", "paso2", ...]}'
    )
    resp = c.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=600,
        messages=[
            {
                "role": "system",
                "content": "Experto en reparación HVAC. Pasos breves y ordenados.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    raw = (resp.choices[0].message.content or "{}").strip()
    try:
        if "```" in raw:
            raw = raw.split("json")[-1].split("```")[0]
        data = json.loads(raw)
        causa = str(data.get("causa_probable", ""))
        pasos = [str(x) for x in (data.get("pasos") or [])]
    except Exception:
        causa = "Revisar en campo según síntomas."
        pasos = ["Verificar alimentación", "Inspeccionar componentes", "Probar tras reparación"]
    return {"causa_probable": causa, "pasos": pasos}


@router.post("/guardar")
def guardar_correctivo(
    body: GuardarCorrectivo,
    user: Usuario = Depends(require_tecnico_or_admin),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

    eq = get_equipo_or_404(db, body.equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_edit_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")

    def _parse_dt(s: str | None):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None

    cor = Correctivo(
        equipo_id=eq.id,
        tecnico_id=user.id,
        sintomas_json=json.dumps(body.sintomas_json, ensure_ascii=False),
        descripcion=body.descripcion.strip() or None,
        causa=body.causa.strip() or None,
        pasos_json=json.dumps(body.pasos_json, ensure_ascii=False),
        acciones_realizadas=body.acciones_realizadas.strip() or None,
        fotos_urls=json.dumps(body.fotos_urls, ensure_ascii=False) if body.fotos_urls else None,
        tiempo_inicio=_parse_dt(body.tiempo_inicio),
        tiempo_fin=_parse_dt(body.tiempo_fin),
        duracion_minutos=body.duracion_minutos,
        pdf_url=body.pdf_url,
    )
    db.add(cor)
    db.commit()
    db.refresh(cor)

    eq.score_actualizado = datetime.now(timezone.utc)
    db.add(eq)
    db.commit()

    return {"ok": True, "id": cor.id, "correctivo": model_to_dict(cor)}
