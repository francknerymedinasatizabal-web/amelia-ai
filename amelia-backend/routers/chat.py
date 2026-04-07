from __future__ import annotations

import os

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


SYSTEM = (
    "Eres Amelia, asistente técnico industrial HVAC (R22, R410A, R32, splits, VRF, chillers).\n"
    "Respuestas breves y accionables; valores numéricos exactos cuando apliquen.\n"
    "Máximo 150 palabras. Prioriza seguridad (eléctrica, refrigerante, EPP) y usa emojis."
)


class ChatRequest(BaseModel):
    messages: list[dict]
    contexto_campo: str | None = None


@router.post("/")
async def chat(req: ChatRequest):
    historial = req.messages[-6:]
    client = _get_client()
    system = SYSTEM
    if req.contexto_campo and req.contexto_campo.strip():
        system = (
            SYSTEM
            + "\n\nContexto de campo (úsalo si es relevante):\n"
            + req.contexto_campo.strip()
        )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=400,
        temperature=0.4,
        messages=[{"role": "system", "content": system}, *historial],
    )
    return {
        "respuesta": resp.choices[0].message.content or "",
        "tokens": resp.usage.total_tokens if resp.usage else None,
    }
