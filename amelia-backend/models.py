from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    codigo_org: Mapped[str] = mapped_column(String(16), nullable=False, default="CAP")
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="empresa")
    equipos: Mapped[list["Equipo"]] = relationship(back_populates="empresa")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id"), default=1)
    rol: Mapped[str] = mapped_column(String(32), nullable=False, default="tecnico")
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    empresa: Mapped[Empresa | None] = relationship(back_populates="usuarios")
    equipos: Mapped[list["Equipo"]] = relationship(
        back_populates="usuario",
        foreign_keys="Equipo.usuario_id",
    )
    equipos_como_cliente: Mapped[list["Equipo"]] = relationship(
        back_populates="cliente",
        foreign_keys="Equipo.cliente_id",
    )
    mantenimientos: Mapped[list["Mantenimiento"]] = relationship(back_populates="usuario")
    asignaciones: Mapped[list["EquipoAsignacion"]] = relationship(
        back_populates="tecnico", foreign_keys="EquipoAsignacion.tecnico_id"
    )


class EquipoAsignacion(Base):
    """Equipo ↔ técnico (un equipo puede tener varios técnicos asignados)."""

    __tablename__ = "equipo_asignaciones"
    __table_args__ = (UniqueConstraint("equipo_id", "tecnico_id", name="uq_equipo_tecnico"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id", ondelete="CASCADE"))
    tecnico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))

    equipo: Mapped["Equipo"] = relationship(back_populates="asignaciones_tecnicos")
    tecnico: Mapped["Usuario"] = relationship(back_populates="asignaciones")


class Equipo(Base):
    __tablename__ = "equipos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id"), default=1)
    placa_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    marca: Mapped[str | None] = mapped_column(String(128), nullable=True)
    modelo: Mapped[str | None] = mapped_column(String(128), nullable=True)
    capacidad_btu: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sede: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_instalacion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(128), nullable=True)
    qr_code: Mapped[str | None] = mapped_column(String(512), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=75)
    score_actualizado: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    memoria_ia: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped[Usuario] = relationship(
        back_populates="equipos",
        foreign_keys=[usuario_id],
    )
    empresa: Mapped[Empresa | None] = relationship(back_populates="equipos")
    cliente: Mapped[Usuario | None] = relationship(
        back_populates="equipos_como_cliente",
        foreign_keys=[cliente_id],
    )
    mantenimientos: Mapped[list["Mantenimiento"]] = relationship(back_populates="equipo_rel")
    asignaciones_tecnicos: Mapped[list["EquipoAsignacion"]] = relationship(
        back_populates="equipo", cascade="all, delete-orphan"
    )
    preventivos: Mapped[list["Preventivo"]] = relationship(back_populates="equipo")
    correctivos: Mapped[list["Correctivo"]] = relationship(back_populates="equipo")


class Mantenimiento(Base):
    __tablename__ = "mantenimientos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[str | None] = mapped_column(String(64), nullable=True)
    equipo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    problema: Mapped[str | None] = mapped_column(Text, nullable=True)
    sintoma: Mapped[str | None] = mapped_column(Text, nullable=True)
    tecnico: Mapped[str | None] = mapped_column(String(255), nullable=True)
    diagnostico: Mapped[str | None] = mapped_column(Text, nullable=True)
    solucion: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str | None] = mapped_column(String(64), default="pendiente")
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    equipo_id: Mapped[int | None] = mapped_column(ForeignKey("equipos.id"), nullable=True)
    riesgo: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tiempo_estimado: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tiempo_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tiempo_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duracion_minutos: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo_servicio: Mapped[str | None] = mapped_column(String(32), nullable=True)

    usuario: Mapped[Usuario | None] = relationship(back_populates="mantenimientos")
    equipo_rel: Mapped[Equipo | None] = relationship(
        back_populates="mantenimientos", foreign_keys=[equipo_id]
    )


class Preventivo(Base):
    __tablename__ = "preventivos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id", ondelete="CASCADE"))
    tecnico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    checklist_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    tiempo_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tiempo_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duracion_minutos: Mapped[float | None] = mapped_column(Float, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    equipo: Mapped[Equipo] = relationship(back_populates="preventivos")
    tecnico: Mapped[Usuario] = relationship()


class Correctivo(Base):
    __tablename__ = "correctivos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id", ondelete="CASCADE"))
    tecnico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    sintomas_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    causa: Mapped[str | None] = mapped_column(Text, nullable=True)
    pasos_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    acciones_realizadas: Mapped[str | None] = mapped_column(Text, nullable=True)
    fotos_urls: Mapped[str | None] = mapped_column(Text, nullable=True)
    tiempo_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tiempo_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duracion_minutos: Mapped[float | None] = mapped_column(Float, nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    equipo: Mapped[Equipo] = relationship(back_populates="correctivos")
    tecnico: Mapped[Usuario] = relationship()
