from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models import Correctivo, Equipo, EquipoAsignacion, Mantenimiento, Preventivo, Usuario

router = APIRouter()


def _month_start():
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@router.get("/admin")
def dash_admin(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.rol != "admin":
        raise HTTPException(403, "Solo administradores")
    eid = user.empresa_id or 1
    n_eq = db.scalar(select(func.count()).select_from(Equipo).where(Equipo.empresa_id == eid)) or 0
    m0 = _month_start()
    n_prev = (
        db.scalar(
            select(func.count())
            .select_from(Preventivo)
            .join(Equipo, Equipo.id == Preventivo.equipo_id)
            .where(Equipo.empresa_id == eid, Preventivo.creado_en >= m0)
        )
        or 0
    )
    n_corr = (
        db.scalar(
            select(func.count())
            .select_from(Correctivo)
            .join(Equipo, Equipo.id == Correctivo.equipo_id)
            .where(Equipo.empresa_id == eid, Correctivo.creado_en >= m0)
        )
        or 0
    )
    riesgo = (
        db.scalar(
            select(func.count())
            .select_from(Equipo)
            .where(Equipo.empresa_id == eid, Equipo.score < 60)
        )
        or 0
    )
    return {
        "total_equipos": n_eq,
        "servicios_mes": {"preventivos": n_prev, "correctivos": n_corr},
        "equipos_riesgo_score": riesgo,
    }


@router.get("/tecnico")
def dash_tecnico(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.rol != "tecnico":
        raise HTTPException(403, "Solo técnicos")
    eid = user.empresa_id or 1
    sub = select(EquipoAsignacion.equipo_id).where(EquipoAsignacion.tecnico_id == user.id)
    rows = (
        db.execute(
            select(Equipo).where(
                Equipo.empresa_id == eid,
                or_(Equipo.usuario_id == user.id, Equipo.id.in_(sub)),
            )
        )
        .scalars()
        .all()
    )
    m0 = _month_start()
    n_serv = (
        db.scalar(
            select(func.count())
            .select_from(Preventivo)
            .where(Preventivo.tecnico_id == user.id, Preventivo.creado_en >= m0)
        )
        or 0
    ) + (
        db.scalar(
            select(func.count())
            .select_from(Correctivo)
            .where(Correctivo.tecnico_id == user.id, Correctivo.creado_en >= m0)
        )
        or 0
    )
    return {
        "equipos_asignados": [e.id for e in rows],
        "equipos": [{"id": e.id, "nombre": e.nombre, "score": e.score} for e in rows],
        "servicios_completados_mes": n_serv,
    }


@router.get("/cliente")
def dash_cliente(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.rol != "cliente":
        raise HTTPException(403, "Solo clientes")
    rows = (
        db.execute(select(Equipo).where(Equipo.cliente_id == user.id))
        .scalars()
        .all()
    )
    out = []
    for e in rows:
        last = None
        lp = (
            db.execute(
                select(Preventivo.creado_en)
                .where(Preventivo.equipo_id == e.id)
                .order_by(Preventivo.creado_en.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        if lp:
            last = lp.isoformat() if hasattr(lp, "isoformat") else str(lp)
        out.append({"id": e.id, "nombre": e.nombre, "score": e.score, "ultimo_servicio": last})
    return {"equipos": out}
