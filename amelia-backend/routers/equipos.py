from __future__ import annotations

import base64
import io
import json
import os
from datetime import datetime, timezone

import qrcode
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from access import get_equipo_or_404, user_may_edit_equipo, user_may_view_equipo
from database import get_db, model_to_dict
from deps import get_current_user, get_current_user_id, require_admin, require_tecnico_or_admin
from equipo_codigo import generar_codigo_equipo_nuevo
from models import Correctivo, Equipo, EquipoAsignacion, Mantenimiento, Preventivo, Usuario

router = APIRouter()

_oai: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _oai
    if _oai is None:
        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise HTTPException(503, "OPENAI_API_KEY no configurada")
        _oai = OpenAI(api_key=key)
    return _oai


def _public_base() -> str:
    return os.getenv("PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")


class EquipoCreate(BaseModel):
    nombre: str
    tipo: str = ""
    ubicacion: str = ""
    sede: str = ""
    placa_json: str | None = None
    cliente_id: int | None = None
    marca: str | None = None
    modelo: str | None = None
    capacidad_btu: int | None = None
    fecha_instalacion: str | None = None
    numero_serie: str | None = None
    tecnico_ids: list[int] = Field(default_factory=list)


class EquipoUpdate(BaseModel):
    nombre: str | None = None
    tipo: str | None = None
    ubicacion: str | None = None
    sede: str | None = None
    cliente_id: int | None = None
    marca: str | None = None
    modelo: str | None = None
    capacidad_btu: int | None = None
    fecha_instalacion: str | None = None
    numero_serie: str | None = None


class AsignarBody(BaseModel):
    tecnico_id: int


def _empresa_id_usuario(db: Session, uid: int) -> int:
    u = db.get(Usuario, uid)
    if not u or u.empresa_id is None:
        return 1
    return int(u.empresa_id)


@router.get("")
def list_equipos(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = _empresa_id_usuario(db, user.id)
    if user.rol == "admin":
        rows = (
            db.execute(select(Equipo).where(Equipo.empresa_id == eid).order_by(func.lower(Equipo.nombre)))
            .scalars()
            .all()
        )
    elif user.rol == "cliente":
        rows = (
            db.execute(
                select(Equipo)
                .where(Equipo.cliente_id == user.id)
                .order_by(func.lower(Equipo.nombre))
            )
            .scalars()
            .all()
        )
    else:
        sub = select(EquipoAsignacion.equipo_id).where(EquipoAsignacion.tecnico_id == user.id)
        rows = (
            db.execute(
                select(Equipo)
                .where(
                    Equipo.empresa_id == eid,
                    or_(Equipo.usuario_id == user.id, Equipo.id.in_(sub)),
                )
                .order_by(func.lower(Equipo.nombre))
            )
            .scalars()
            .all()
        )
    return [model_to_dict(r) for r in rows]


@router.get("/{equipo_id}")
def get_equipo(
    equipo_id: int,
    user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_view_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")
    out = model_to_dict(eq)
    if eq.cliente_id:
        cli = db.get(Usuario, eq.cliente_id)
        out["cliente_nombre"] = cli.nombre if cli else None
    return out


@router.get("/{equipo_id}/qr")
def get_equipo_qr(
    equipo_id: int,
    user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_view_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")
    url = eq.qr_code or f"{_public_base()}/equipos/{eq.id}"
    img = qrcode.make(url, box_size=6, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return {"url": url, "png_base64": b64}


@router.post("/{equipo_id}/score")
def post_equipo_score(
    equipo_id: int,
    user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_view_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")

    prev_n = (
        db.scalar(
            select(func.count())
            .select_from(Preventivo)
            .where(Preventivo.equipo_id == eq.id)
        )
        or 0
    )
    corr_n = (
        db.scalar(
            select(func.count()).select_from(Correctivo).where(Correctivo.equipo_id == eq.id)
        )
        or 0
    )
    last_m = (
        db.execute(
            select(Mantenimiento)
            .where(Mantenimiento.equipo_id == eq.id)
            .order_by(Mantenimiento.creado_en.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    last_obs = (last_m.diagnostico or last_m.problema or "")[:800] if last_m else ""

    client = _get_openai()
    prompt = (
        f"Equipo HVAC: tipo={eq.tipo}, antigüedad relativa desde instalación={eq.fecha_instalacion or 'desconocida'}. "
        f"Preventivos registrados (total aprox): {prev_n}. Correctivos (total aprox): {corr_n}. "
        f"Última observación técnica: {last_obs or 'ninguna'}. "
        "Devuelve SOLO un JSON válido: {\"score\": <entero 0-100>, \"motivo\": \"una frase\"}."
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=120,
        messages=[
            {
                "role": "system",
                "content": "Eres experto en mantenimiento HVAC. Evalúa riesgo operativo y salud del activo.",
            },
            {"role": "user", "content": prompt},
        ],
    )
    raw = (resp.choices[0].message.content or "{}").strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[-2] if raw.count("```") >= 2 else raw.replace("```json", "").replace("```", "")
        data = json.loads(raw)
        score = int(data.get("score", 70))
        score = max(0, min(100, score))
    except Exception:
        score = 70

    eq.score = score
    eq.score_actualizado = datetime.now(timezone.utc)
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return {"score": eq.score, "score_actualizado": eq.score_actualizado.isoformat() if eq.score_actualizado else None}


@router.post("")
def create_equipo(
    body: EquipoCreate,
    user: Usuario = Depends(require_tecnico_or_admin),
    db: Session = Depends(get_db),
):
    nombre = body.nombre.strip()
    if not nombre:
        raise HTTPException(400, "El nombre del equipo es obligatorio")

    empresa_id = _empresa_id_usuario(db, user.id)
    codigo = generar_codigo_equipo_nuevo(db, empresa_id, body.tipo)

    placa_val = body.placa_json.strip() if body.placa_json else None
    if placa_val == "":
        placa_val = None

    cliente_id = body.cliente_id
    if user.rol != "admin":
        cliente_id = None

    eq = Equipo(
        nombre=nombre,
        tipo=body.tipo.strip() or None,
        ubicacion=body.ubicacion.strip() or None,
        sede=body.sede.strip() or None,
        usuario_id=user.id,
        empresa_id=empresa_id,
        codigo=codigo,
        placa_json=placa_val,
        cliente_id=cliente_id,
        marca=body.marca.strip() if body.marca else None,
        modelo=body.modelo.strip() if body.modelo else None,
        capacidad_btu=body.capacidad_btu,
        fecha_instalacion=body.fecha_instalacion.strip() if body.fecha_instalacion else None,
        numero_serie=body.numero_serie.strip() if body.numero_serie else None,
        score=75,
    )
    db.add(eq)
    db.flush()
    eq.qr_code = f"{_public_base()}/equipos/{eq.id}"
    db.add(eq)

    tids = list(body.tecnico_ids)
    if user.rol == "admin" and tids:
        for tid in set(tids):
            if tid > 0:
                db.add(EquipoAsignacion(equipo_id=eq.id, tecnico_id=tid))
    else:
        db.add(EquipoAsignacion(equipo_id=eq.id, tecnico_id=user.id))

    db.commit()
    db.refresh(eq)
    return model_to_dict(eq)


@router.post("/{equipo_id}/asignar")
def asignar_tecnico(
    equipo_id: int,
    body: AsignarBody,
    _: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    tech = db.get(Usuario, body.tecnico_id)
    if not tech or tech.rol != "tecnico":
        raise HTTPException(400, "Técnico inválido")
    exists = (
        db.execute(
            select(EquipoAsignacion).where(
                EquipoAsignacion.equipo_id == eq.id,
                EquipoAsignacion.tecnico_id == body.tecnico_id,
            )
        )
        .scalars()
        .first()
    )
    if not exists:
        db.add(EquipoAsignacion(equipo_id=eq.id, tecnico_id=body.tecnico_id))
        db.commit()
    return {"ok": True}


@router.patch("/{equipo_id}")
def update_equipo(
    equipo_id: int,
    body: EquipoUpdate,
    user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_edit_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")
    if user.rol == "cliente":
        raise HTTPException(403, "No autorizado")

    if body.nombre is not None:
        eq.nombre = body.nombre.strip()
    if body.tipo is not None:
        eq.tipo = body.tipo.strip()
    if body.ubicacion is not None:
        eq.ubicacion = body.ubicacion.strip()
    if body.sede is not None:
        eq.sede = body.sede.strip()
    if body.marca is not None:
        eq.marca = body.marca.strip() or None
    if body.modelo is not None:
        eq.modelo = body.modelo.strip() or None
    if body.capacidad_btu is not None:
        eq.capacidad_btu = body.capacidad_btu
    if body.fecha_instalacion is not None:
        eq.fecha_instalacion = body.fecha_instalacion.strip() or None
    if body.numero_serie is not None:
        eq.numero_serie = body.numero_serie.strip() or None
    if body.cliente_id is not None and user.rol == "admin":
        eq.cliente_id = body.cliente_id

    db.commit()
    db.refresh(eq)
    return model_to_dict(eq)


@router.delete("/{equipo_id}")
def delete_equipo(
    equipo_id: int,
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    from sqlalchemy import update

    user = db.get(Usuario, uid)
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user:
        raise HTTPException(401, "No autenticado")
    if user.rol != "admin" and eq.usuario_id != uid:
        raise HTTPException(403, "No autorizado")
    db.execute(
        update(Mantenimiento).where(Mantenimiento.equipo_id == equipo_id).values(equipo_id=None)
    )
    db.delete(eq)
    db.commit()
    return {"ok": True}

