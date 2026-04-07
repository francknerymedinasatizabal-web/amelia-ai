#!/usr/bin/env python3
"""
Copia datos de SQLite (amelia.db) → PostgreSQL (DATABASE_URL).
Borra y recrea tablas en Postgres (¡backup antes!).

  $env:DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/dbname"
  cd amelia-backend
  python scripts/migrate_sqlite_to_postgres.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from models import Base, Empresa, Equipo, Mantenimiento, Usuario


def _pg_url() -> str:
    u = os.environ.get("DATABASE_URL", "").strip()
    if not u:
        raise SystemExit("Define DATABASE_URL apuntando a PostgreSQL.")
    if u.startswith("postgres://"):
        u = "postgresql+psycopg2://" + u[len("postgres://") :]
    elif u.startswith("postgresql://") and not u.startswith("postgresql+psycopg2://"):
        u = "postgresql+psycopg2://" + u[len("postgresql://") :]
    return u


def main() -> None:
    sqlite_path = ROOT / "amelia.db"
    if not sqlite_path.is_file():
        raise SystemExit(f"No existe {sqlite_path}")

    pg_url = _pg_url()
    sqlite_engine = create_engine(
        f"sqlite:///{sqlite_path.as_posix()}", connect_args={"check_same_thread": False}
    )
    pg_engine = create_engine(pg_url, pool_pre_ping=True)

    insp_sqlite = inspect(sqlite_engine)
    uc = {c["name"] for c in insp_sqlite.get_columns("usuarios")}

    Base.metadata.drop_all(bind=pg_engine)
    Base.metadata.create_all(bind=pg_engine)

    Sp = sessionmaker(bind=pg_engine)
    dst: Session = Sp()

    try:
        tables = set(insp_sqlite.get_table_names())
        if not tables >= {"usuarios", "equipos", "mantenimientos"}:
            raise SystemExit("SQLite incompleto: faltan tablas mínimas.")

        with sqlite_engine.connect() as raw:
            emp_n = 0
            if "empresas" in tables:
                for row in raw.execute(text("SELECT * FROM empresas")).mappings():
                    r = dict(row)
                    dst.add(
                        Empresa(
                            id=r["id"],
                            nombre=r["nombre"],
                            codigo_org=r.get("codigo_org") or "CAP",
                        )
                    )
                    emp_n += 1
            if emp_n == 0:
                dst.add(Empresa(nombre="Central de Aires del Pacífico", codigo_org="CAP"))
            dst.flush()

            for row in raw.execute(text("SELECT * FROM usuarios")).mappings():
                r = dict(row)
                rol = (r.get("rol") or "tecnico") if "rol" in uc else "tecnico"
                dst.add(
                    Usuario(
                        id=r["id"],
                        nombre=r["nombre"],
                        email=r["email"],
                        password_hash=r["password_hash"],
                        empresa_id=int(r["empresa_id"]) if r.get("empresa_id") is not None else 1,
                        rol=rol,
                    )
                )
            dst.flush()

            for row in raw.execute(text("SELECT * FROM equipos")).mappings():
                r = dict(row)
                dst.add(
                    Equipo(
                        id=r["id"],
                        codigo=r.get("codigo"),
                        nombre=r["nombre"],
                        tipo=r.get("tipo"),
                        ubicacion=r.get("ubicacion"),
                        usuario_id=r["usuario_id"],
                        empresa_id=int(r["empresa_id"]) if r.get("empresa_id") is not None else 1,
                        placa_json=r.get("placa_json"),
                    )
                )
            dst.flush()

            for row in raw.execute(text("SELECT * FROM mantenimientos")).mappings():
                m = dict(row)
                dst.add(
                    Mantenimiento(
                        id=m["id"],
                        fecha=m.get("fecha"),
                        equipo=m.get("equipo"),
                        problema=m.get("problema"),
                        sintoma=m.get("sintoma"),
                        tecnico=m.get("tecnico"),
                        diagnostico=m.get("diagnostico"),
                        solucion=m.get("solucion"),
                        estado=m.get("estado") or "pendiente",
                        usuario_id=m.get("usuario_id"),
                        equipo_id=m.get("equipo_id"),
                        riesgo=m.get("riesgo"),
                        tiempo_estimado=m.get("tiempo_estimado"),
                    )
                )

        dst.commit()

        with pg_engine.connect() as pg:
            for tbl in ("empresas", "usuarios", "equipos", "mantenimientos"):
                try:
                    pg.execute(
                        text(
                            f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), "
                            f"(SELECT COALESCE(MAX(id), 1) FROM {tbl}))"
                        )
                    )
                except Exception:
                    pass
            pg.commit()

        print("Migración OK.")
    except Exception as e:
        dst.rollback()
        raise e
    finally:
        dst.close()


if __name__ == "__main__":
    main()
