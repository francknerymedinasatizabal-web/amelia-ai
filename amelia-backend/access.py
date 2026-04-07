"""Autorización por rol para equipos y datos de servicio."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Equipo, EquipoAsignacion, Usuario


def user_may_view_equipo(db: Session, user: Usuario, eq: Equipo) -> bool:
    if user.rol == "admin":
        return True
    if user.rol == "cliente":
        return eq.cliente_id is not None and int(eq.cliente_id) == int(user.id)
    if user.rol == "tecnico":
        if int(eq.usuario_id) == int(user.id):
            return True
        row = (
            db.execute(
                select(EquipoAsignacion).where(
                    EquipoAsignacion.equipo_id == eq.id,
                    EquipoAsignacion.tecnico_id == user.id,
                )
            )
            .scalars()
            .first()
        )
        return row is not None
    return False


def user_may_edit_equipo(db: Session, user: Usuario, eq: Equipo) -> bool:
    if user.rol == "admin":
        return True
    if user.rol == "cliente":
        return False
    if user.rol == "tecnico":
        return user_may_view_equipo(db, user, eq)
    return False


def get_equipo_or_404(db: Session, equipo_id: int) -> Equipo | None:
    return db.get(Equipo, equipo_id)
