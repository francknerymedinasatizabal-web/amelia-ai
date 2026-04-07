from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from access import get_equipo_or_404, user_may_edit_equipo, user_may_view_equipo
from database import get_db, model_to_dict
from deps import get_current_user, require_tecnico_or_admin
from models import Equipo, Preventivo, Usuario

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


class ChecklistReq(BaseModel):
    tipo_equipo: str = ""


class GuardarPreventivo(BaseModel):
    equipo_id: int
    checklist_json: list[dict] = Field(default_factory=list)
    observaciones: str = ""
    tiempo_inicio: str | None = None
    tiempo_fin: str | None = None
    duracion_minutos: float | None = None
    pdf_url: str | None = None


@router.post("/checklist")
def generar_checklist(
    body: ChecklistReq,
    user: Usuario = Depends(require_tecnico_or_admin),
):
    del user
    c = _client()
    prompt = (
        f"Tipo de equipo HVAC: {body.tipo_equipo or 'general'}. "
        "Genera un checklist de mantenimiento preventivo de máximo 12 ítems, lenguaje técnico simple en español. "
        'Responde SOLO JSON: {"items": ["texto1", "texto2", ...]}'
    )
    resp = c.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=500,
        messages=[
            {"role": "system", "content": "Respondes solo JSON válido."},
            {"role": "user", "content": prompt},
        ],
    )
    raw = (resp.choices[0].message.content or "{}").strip()
    try:
        if "```" in raw:
            raw = raw.split("json")[-1].split("```")[0]
        data = json.loads(raw)
        items = data.get("items") or []
        items = [str(x) for x in items][:12]
    except Exception:
        items = [
            "Inspección visual general",
            "Limpieza de filtros",
            "Revisión de drenaje",
            "Prueba de funcionamiento",
        ]
    return {"items": items}


@router.post("/guardar")
def guardar_preventivo(
    body: GuardarPreventivo,
    user: Usuario = Depends(require_tecnico_or_admin),
    db: Session = Depends(get_db),
):
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

    chk = body.checklist_json
    if isinstance(chk, list):
        checklist_str = json.dumps(chk, ensure_ascii=False)
    else:
        checklist_str = str(chk)

    prev = Preventivo(
        equipo_id=eq.id,
        tecnico_id=user.id,
        checklist_json=checklist_str,
        observaciones=body.observaciones.strip() or None,
        tiempo_inicio=_parse_dt(body.tiempo_inicio),
        tiempo_fin=_parse_dt(body.tiempo_fin),
        duracion_minutos=body.duracion_minutos,
        pdf_url=body.pdf_url,
    )
    db.add(prev)
    db.commit()
    db.refresh(prev)

    eq.score_actualizado = datetime.now(timezone.utc)
    db.add(eq)
    db.commit()

    return {"ok": True, "id": prev.id, "preventivo": model_to_dict(prev)}
