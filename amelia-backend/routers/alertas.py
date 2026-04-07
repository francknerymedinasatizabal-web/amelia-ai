from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from deps import require_admin
from models import Correctivo, Equipo, Mantenimiento, Preventivo, Usuario

router = APIRouter()


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.get("")
def list_alertas(_admin: Usuario = Depends(require_admin), db: Session = Depends(get_db)):
    del _admin
    now = datetime.now(timezone.utc)
    three_mo = now - timedelta(days=90)
    six_mo = now - timedelta(days=180)

    alertas: list[dict] = []

    equipos = db.execute(select(Equipo)).scalars().all()
    for eq in equipos:
        cli = db.get(Usuario, eq.cliente_id) if eq.cliente_id else None

        if eq.score is not None and eq.score < 60:
            alertas.append(
                {
                    "tipo": "riesgo_alto",
                    "equipo_id": eq.id,
                    "equipo_nombre": eq.nombre,
                    "cliente": cli.nombre if cli else "",
                    "detalle": f"Score {eq.score}",
                }
            )

        dates: list[datetime] = []
        lp = (
            db.execute(
                select(Preventivo.creado_en)
                .where(Preventivo.equipo_id == eq.id)
                .order_by(Preventivo.creado_en.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        if lp:
            d = _aware(lp)
            if d:
                dates.append(d)
        lc = (
            db.execute(
                select(Correctivo.creado_en)
                .where(Correctivo.equipo_id == eq.id)
                .order_by(Correctivo.creado_en.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        if lc:
            d = _aware(lc)
            if d:
                dates.append(d)
        lm = (
            db.execute(
                select(Mantenimiento.creado_en)
                .where(Mantenimiento.equipo_id == eq.id)
                .order_by(Mantenimiento.creado_en.desc())
                .limit(1)
            )
            .scalars()
            .first()
        )
        if lm:
            d = _aware(lm)
            if d:
                dates.append(d)

        last_any = max(dates) if dates else None
        if last_any is not None and last_any < six_mo:
            alertas.append(
                {
                    "tipo": "vencido",
                    "equipo_id": eq.id,
                    "equipo_nombre": eq.nombre,
                    "cliente": cli.nombre if cli else "",
                    "detalle": "Sin servicio registrado reciente (>6 meses)",
                }
            )

        n_corr = (
            db.scalar(
                select(func.count())
                .select_from(Correctivo)
                .where(
                    Correctivo.equipo_id == eq.id,
                    Correctivo.creado_en >= three_mo,
                )
            )
            or 0
        )
        if n_corr > 2:
            alertas.append(
                {
                    "tipo": "falla_recurrente",
                    "equipo_id": eq.id,
                    "equipo_nombre": eq.nombre,
                    "cliente": cli.nombre if cli else "",
                    "detalle": f"{n_corr} correctivos en 3 meses",
                }
            )

    return {"alertas": alertas}
