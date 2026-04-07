from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from security import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> int:
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload: dict[str, Any] = decode_token(creds.credentials)
        uid = int(payload.get("sub", 0))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        ) from None
    if uid <= 0:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.get(Usuario, uid)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return uid


def get_current_user(
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Usuario:
    u = db.get(Usuario, uid)
    if not u:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return u


def require_admin(
    user: Usuario = Depends(get_current_user),
) -> Usuario:
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol administrador")
    return user


def require_tecnico_or_admin(
    user: Usuario = Depends(get_current_user),
) -> Usuario:
    if user.rol not in ("tecnico", "admin"):
        raise HTTPException(status_code=403, detail="Se requiere técnico o administrador")
    return user
