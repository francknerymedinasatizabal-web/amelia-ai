"""Motor SQLAlchemy: SQLite (dev) o PostgreSQL (producción) vía DATABASE_URL."""
from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine, func, or_, select, text
from sqlalchemy.orm import Session, sessionmaker

from models import (  # noqa: F401 - metadatos de tablas
    Base,
    Correctivo,
    Empresa,
    Equipo,
    EquipoAsignacion,
    Mantenimiento,
    Preventivo,
    Usuario,
)

_engine = None
SessionLocal: sessionmaker | None = None


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./amelia.db").strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://") :]
    return url


def _make_engine():
    global _engine, SessionLocal
    url = get_database_url()
    if "sqlite" in url:
        eng = create_engine(url, connect_args={"check_same_thread": False})
    else:
        eng = create_engine(url, pool_pre_ping=True)
    _engine = eng
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return eng


def get_engine():
    global _engine
    if _engine is None:
        return _make_engine()
    return _engine


def get_db() -> Generator[Session, None, None]:
    get_engine()
    assert SessionLocal is not None
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _sqlite_patch_legacy(engine) -> None:
    """Parches para bases SQLite creadas antes de migraciones recientes."""
    url = str(engine.url)
    if "sqlite" not in url:
        return
    from sqlalchemy import inspect

    insp = inspect(engine)
    with engine.connect() as conn:
        if "usuarios" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("usuarios")}
            if "rol" not in cols:
                conn.execute(text("ALTER TABLE usuarios ADD COLUMN rol VARCHAR(32) DEFAULT 'tecnico'"))
            if "empresa_id" not in cols:
                conn.execute(text("ALTER TABLE usuarios ADD COLUMN empresa_id INTEGER DEFAULT 1"))
                conn.execute(text("UPDATE usuarios SET empresa_id = 1 WHERE empresa_id IS NULL"))
        if "equipos" in insp.get_table_names():
            ec = {c["name"] for c in insp.get_columns("equipos")}
            if "empresa_id" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN empresa_id INTEGER DEFAULT 1"))
                conn.execute(text("UPDATE equipos SET empresa_id = 1 WHERE empresa_id IS NULL"))
            if "codigo" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN codigo VARCHAR(64)"))
            if "placa_json" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN placa_json TEXT"))
            if "cliente_id" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN cliente_id INTEGER"))
            if "marca" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN marca VARCHAR(128)"))
            if "modelo" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN modelo VARCHAR(128)"))
            if "capacidad_btu" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN capacidad_btu INTEGER"))
            if "sede" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN sede VARCHAR(255)"))
            if "fecha_instalacion" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN fecha_instalacion VARCHAR(32)"))
            if "numero_serie" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN numero_serie VARCHAR(128)"))
            if "qr_code" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN qr_code VARCHAR(512)"))
            if "score" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN score INTEGER DEFAULT 75"))
            if "score_actualizado" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN score_actualizado TIMESTAMP"))
            if "memoria_ia" not in ec:
                conn.execute(text("ALTER TABLE equipos ADD COLUMN memoria_ia TEXT"))
        if "mantenimientos" in insp.get_table_names():
            mc = {c["name"] for c in insp.get_columns("mantenimientos")}
            if "tiempo_inicio" not in mc:
                conn.execute(text("ALTER TABLE mantenimientos ADD COLUMN tiempo_inicio TIMESTAMP"))
            if "tiempo_fin" not in mc:
                conn.execute(text("ALTER TABLE mantenimientos ADD COLUMN tiempo_fin TIMESTAMP"))
            if "duracion_minutos" not in mc:
                conn.execute(text("ALTER TABLE mantenimientos ADD COLUMN duracion_minutos REAL"))
            if "tipo_servicio" not in mc:
                conn.execute(text("ALTER TABLE mantenimientos ADD COLUMN tipo_servicio VARCHAR(32)"))
        conn.commit()


def init_db():
    eng = get_engine()
    assert SessionLocal is not None
    Base.metadata.create_all(bind=eng)
    _sqlite_patch_legacy(eng)
    db = SessionLocal()
    try:
        _seed_empresa(db)
        _backfill_codigos_equipos(db)
        _backfill_qr_equipos(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _seed_empresa(db: Session) -> None:
    n = db.scalar(select(func.count()).select_from(Empresa))
    if n == 0:
        db.add(
            Empresa(
                nombre="Central de Aires del Pacífico",
                codigo_org="CAP",
            )
        )
        db.flush()


def _backfill_codigos_equipos(db: Session) -> None:
    from equipo_codigo import generar_codigo_equipo, obtener_ultimo_numero, prefijo_desde_tipo

    rows = (
        db.execute(select(Equipo).where(or_(Equipo.codigo.is_(None), Equipo.codigo == "")))
        .scalars()
        .all()
    )
    for eq in sorted(rows, key=lambda e: e.id):
        eid = eq.empresa_id or 1
        tipo = eq.tipo or ""
        ult = obtener_ultimo_numero(db, eid, prefijo_desde_tipo(tipo))
        eq.codigo = generar_codigo_equipo(tipo, ult)
        db.add(eq)


def _backfill_qr_equipos(db: Session) -> None:
    base = os.getenv("PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
    rows = db.execute(select(Equipo)).scalars().all()
    for eq in rows:
        if not eq.qr_code:
            eq.qr_code = f"{base}/equipos/{eq.id}"
            db.add(eq)


def model_to_dict(obj) -> dict:
    out: dict = {}
    for c in obj.__table__.columns:
        v = getattr(obj, c.key)
        if hasattr(v, "isoformat"):
            v = v.isoformat() if v is not None else None
        out[c.key] = v
    return out
