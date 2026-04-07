from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db, model_to_dict
from deps import require_admin
from models import Usuario
from security import hash_password

router = APIRouter()


class CrearUsuarioBody(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str  # tecnico | cliente | admin


@router.post("/usuarios")
def crear_usuario(
    body: CrearUsuarioBody,
    admin: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
):
    del admin
    if body.rol not in ("tecnico", "cliente", "admin"):
        raise HTTPException(400, "Rol inválido")
    if len(body.password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    u = Usuario(
        nombre=body.nombre.strip(),
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        empresa_id=1,
        rol=body.rol,
    )
    db.add(u)
    try:
        db.commit()
        db.refresh(u)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(400, "El email ya está registrado") from e
    return model_to_dict(u)
