from __future__ import annotations

import json
import os
import re

from fastapi import APIRouter
from openai import OpenAI
from pydantic import BaseModel

router = APIRouter()
_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY no configurada")
        _client = OpenAI(api_key=key)
    return _client


SYSTEM_CAM = (
    "Eres Amelia, experta en diagnóstico visual de equipos de climatización.\n"
    "Describe hallazgos técnicos concretos y riesgos si los hay.\n"
    "Máximo 120 palabras."
)

SYSTEM_PLACA = """
Eres un técnico HVAC experto de Central de Aires del Pacífico.
Analiza la imagen de una placa de equipo y extrae la información técnica visible.
Responde SOLO un objeto JSON válido (sin markdown ni texto fuera del JSON) con estos campos;
usa null si un dato no es visible o no aplica:
- nombre_equipo (string|null)
- referencia (string|null)
- capacidad_btu (string|null)
- refrigerante (string|null)
- voltaje (string|null)
- corriente (string|null)
- observaciones (string|null)
""".strip()


_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def _parse_extraccion_placa(raw: str) -> dict | None:
    if not raw or not raw.strip():
        return None
    t = raw.strip()
    m = _FENCE.search(t)
    if m:
        t = m.group(1).strip()
    try:
        data = json.loads(t)
        return data if isinstance(data, dict) else {"observaciones": raw}
    except json.JSONDecodeError:
        return {"observaciones": raw, "parse_error": True}


class CamaraRequest(BaseModel):
    imagen: str
    pregunta: str = "¿Qué problema ves? Dame diagnóstico técnico breve."
    mime: str = "image/jpeg"
    """diagnostico = informe libre; placa = lectura JSON de placa de datos."""
    modo: str = "diagnostico"


@router.post("/analizar")
async def analizar(req: CamaraRequest):
    client = _get_client()
    mime = req.mime if "/" in req.mime else "image/jpeg"
    modo = (req.modo or "diagnostico").strip().lower()

    if modo == "placa":
        user_text = (
            "Lee la placa de fabricante en la imagen y devuelve el JSON solicitado. "
            "Si la imagen no muestra una placa, indícalo en observaciones."
        )
        sys_msg = SYSTEM_PLACA
        max_tok = 900
        extra = {"response_format": {"type": "json_object"}}
        img_detail = "high"
    else:
        user_text = req.pregunta
        sys_msg = SYSTEM_CAM
        max_tok = 500
        extra = {}
        img_detail = "low"

    common = dict(
        model="gpt-4o-mini",
        max_tokens=max_tok,
        messages=[
            {"role": "system", "content": sys_msg},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{req.imagen}",
                            "detail": img_detail,
                        },
                    },
                    {"type": "text", "text": user_text},
                ],
            },
        ],
    )
    try:
        resp = client.chat.completions.create(**common, **extra)
    except Exception:
        if modo == "placa" and extra:
            resp = client.chat.completions.create(**common)
        else:
            raise
    content = resp.choices[0].message.content or ""
    tokens = resp.usage.total_tokens if resp.usage else None

    if modo == "placa":
        extraccion = _parse_extraccion_placa(content)
        return {
            "analisis": content,
            "extraccion": extraccion,
            "modo": "placa",
            "tokens": tokens,
        }

    return {
        "analisis": content,
        "extraccion": None,
        "modo": "diagnostico",
        "tokens": tokens,
    }
