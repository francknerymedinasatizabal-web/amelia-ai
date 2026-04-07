from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user_id
from models import Usuario
from security import create_access_token, hash_password, verify_password

router = APIRouter()


class RegisterBody(BaseModel):
    nombre: str
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str = "tecnico"


def _user_token_response(user: Usuario) -> dict:
    token = create_access_token(
        str(user.id),
        {"email": user.email, "rol": user.rol},
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "email": user.email,
            "rol": user.rol,
        },
    }


@router.post("/register", response_model=dict)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    email = body.email.lower().strip()
    u = Usuario(
        nombre=body.nombre.strip(),
        email=email,
        password_hash=hash_password(body.password),
        empresa_id=1,
        rol="tecnico",
    )
    db.add(u)
    try:
        db.commit()
        db.refresh(u)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(400, "El email ya está registrado") from e
    return _user_token_response(u)


@router.post("/login", response_model=dict)
def login(body: LoginBody, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.execute(select(Usuario).where(Usuario.email == email)).scalars().first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
    return _user_token_response(user)


@router.get("/me", response_model=UserOut)
def me(uid: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.get(Usuario, uid)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    return UserOut(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
    )
