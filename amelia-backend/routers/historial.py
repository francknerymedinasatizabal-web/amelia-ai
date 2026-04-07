from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from access import get_equipo_or_404, user_may_view_equipo
from database import get_db, model_to_dict
from deps import get_current_user
from models import Correctivo, Equipo, Mantenimiento, Preventivo, Usuario

router = APIRouter()


def _iso(dt):
    if dt is None:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)


@router.get("/{equipo_id}")
def historial_equipo(
    equipo_id: int,
    user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eq = get_equipo_or_404(db, equipo_id)
    if not eq:
        raise HTTPException(404, "Equipo no encontrado")
    if not user_may_view_equipo(db, user, eq):
        raise HTTPException(403, "No autorizado")

    items: list[dict] = []

    for p in (
        db.execute(select(Preventivo).where(Preventivo.equipo_id == eq.id)).scalars().all()
    ):
        tech = db.get(Usuario, p.tecnico_id)
        items.append(
            {
                "tipo": "preventivo",
                "id": p.id,
                "fecha": _iso(p.creado_en),
                "tecnico": tech.nombre if tech else "",
                "duracion_minutos": p.duracion_minutos,
                "pdf_url": p.pdf_url,
                "resumen": (p.observaciones or "")[:200],
            }
        )

    for c in (
        db.execute(select(Correctivo).where(Correctivo.equipo_id == eq.id)).scalars().all()
    ):
        tech = db.get(Usuario, c.tecnico_id)
        items.append(
            {
                "tipo": "correctivo",
                "id": c.id,
                "fecha": _iso(c.creado_en),
                "tecnico": tech.nombre if tech else "",
                "duracion_minutos": c.duracion_minutos,
                "pdf_url": c.pdf_url,
                "resumen": (c.causa or c.descripcion or "")[:200],
            }
        )

    for m in (
        db.execute(select(Mantenimiento).where(Mantenimiento.equipo_id == eq.id))
        .scalars()
        .all()
    ):
        items.append(
            {
                "tipo": "diagnostico_legacy",
                "id": m.id,
                "fecha": m.creado_en.isoformat() if m.creado_en else m.fecha,
                "tecnico": m.tecnico or "",
                "duracion_minutos": m.duracion_minutos,
                "pdf_url": None,
                "resumen": (m.diagnostico or m.problema or "")[:200],
            }
        )

    def sort_key(x):
        f = x.get("fecha") or ""
        try:
            return datetime.fromisoformat(f.replace("Z", "+00:00"))
        except Exception:
            return datetime.min

    items.sort(key=sort_key, reverse=True)
    return {"equipo_id": eq.id, "items": items}
