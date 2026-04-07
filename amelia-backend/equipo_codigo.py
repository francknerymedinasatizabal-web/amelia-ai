"""Códigos de equipo: legado CAP-… y formato SPLIT-2025-0042 por tipo/año."""
from __future__ import annotations

import re
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Equipo

# Mapeo tipo → prefijo (como en especificación)
_PREFIJOS = {
    "chiller": "CH",
    "compresor": "COMP",
    "ahu": "AHU",
    "split": "SP",
}


def prefijo_desde_tipo(tipo: str) -> str:
    """Infiere prefijo desde texto libre (ej. 'Chiller York' → CH)."""
    t = (tipo or "").strip().lower()
    if not t:
        return "EQ"
    for key, pref in _PREFIJOS.items():
        if key in t or t == key:
            return pref
    if "chill" in t:
        return "CH"
    if "compres" in t:
        return "COMP"
    if "ahu" in t or "manejadora" in t or "rtu" in t:
        return "AHU"
    if "split" in t or "multi" in t or "cassette" in t:
        return "SP"
    return "EQ"


def generar_codigo_equipo(tipo: str, ultimo_numero: int) -> str:
    """
    Ejemplo: tipo 'chiller' o 'Chiller York', ultimo 0 → CAP-CH-001
    """
    pref = prefijo_desde_tipo(tipo)
    numero = str(ultimo_numero + 1).zfill(3)
    return f"CAP-{pref}-{numero}"


_CODIGO_RE = re.compile(r"^CAP-[A-Z]+-(\d+)$", re.IGNORECASE)


def obtener_ultimo_numero(db: Session, empresa_id: int, prefijo_corto: str) -> int:
    """Mayor sufijo numérico existente para CAP-{prefijo}-* en esta empresa."""
    pattern = f"CAP-{prefijo_corto}-%"
    rows = db.execute(
        select(Equipo.codigo).where(
            Equipo.empresa_id == empresa_id,
            Equipo.codigo.isnot(None),
            Equipo.codigo.like(pattern),
        )
    ).scalars().all()
    max_n = 0
    for cod in rows:
        if not cod:
            continue
        m = _CODIGO_RE.match(cod.strip())
        if m:
            max_n = max(max_n, int(m.group(1)))
    return max_n


_CODIGO_NUEVO_RE = re.compile(r"^([A-Z]+)-(\d{4})-(\d+)$", re.IGNORECASE)


def prefijo_catalogo(tipo: str) -> str:
    """Prefijos para formato TIPO-AÑO-NNNN (ej. SPLIT-2025-0042)."""
    t = (tipo or "").strip().lower()
    if "central" in t:
        return "CENTRAL"
    if "cassette" in t:
        return "CASSETTE"
    if "piso" in t or "techo" in t:
        return "PT"
    if "ventil" in t or "ventilacion" in t:
        return "VENT"
    if "chill" in t:
        return "CHILLER"
    if "split" in t:
        return "SPLIT"
    return "EQ"


def generar_codigo_equipo_nuevo(db: Session, empresa_id: int, tipo: str) -> str:
    pref = prefijo_catalogo(tipo)
    year = datetime.now().year
    pattern = f"{pref}-{year}-%"
    rows = (
        db.execute(
            select(Equipo.codigo).where(
                Equipo.empresa_id == empresa_id,
                Equipo.codigo.isnot(None),
                Equipo.codigo.like(pattern),
            )
        )
        .scalars()
        .all()
    )
    max_n = 0
    for cod in rows:
        if not cod:
            continue
        m = _CODIGO_NUEVO_RE.match(cod.strip())
        if m and int(m.group(2)) == year:
            max_n = max(max_n, int(m.group(3)))
    return f"{pref}-{year}-{max_n + 1:04d}"
