const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const PERSIST_KEY = "amelia-auth";

function getPersistedToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { state?: { token?: string | null } };
    return p.state?.token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const t = getPersistedToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type AuthUser = {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
};

export type Equipo = {
  id: number;
  codigo?: string | null;
  nombre: string;
  tipo: string | null;
  ubicacion: string | null;
  usuario_id: number;
  empresa_id?: number | null;
  placa_json?: string | null;
  creado_en: string | null;
  cliente_id?: number | null;
  marca?: string | null;
  modelo?: string | null;
  capacidad_btu?: number | null;
  sede?: string | null;
  fecha_instalacion?: string | null;
  numero_serie?: string | null;
  qr_code?: string | null;
  score?: number | null;
  score_actualizado?: string | null;
  memoria_ia?: string | null;
  cliente_nombre?: string | null;
};

export type Mantenimiento = {
  id: number;
  fecha: string | null;
  equipo: string | null;
  problema: string | null;
  sintoma: string | null;
  tecnico: string | null;
  diagnostico: string | null;
  solucion: string | null;
  estado: string | null;
  creado_en: string | null;
  usuario_id: number | null;
  equipo_id: number | null;
  riesgo: string | null;
  tiempo_estimado: string | null;
  equipo_nombre?: string | null;
  equipo_tipo?: string | null;
  equipo_ubicacion?: string | null;
};

export async function authRegister(nombre: string, email: string, password: string) {
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    access_token: string;
    token_type: string;
    user: AuthUser;
  }>;
}

export async function authLogin(email: string, password: string) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    access_token: string;
    token_type: string;
    user: AuthUser;
  }>;
}

export async function authMe() {
  const r = await fetch(`${API}/auth/me`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<AuthUser>;
}

export async function listEquipos() {
  const r = await fetch(`${API}/equipos`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Equipo[]>;
}

export async function createEquipo(data: {
  nombre: string;
  tipo?: string;
  ubicacion?: string;
  sede?: string;
  placa_json?: string | null;
  cliente_id?: number | null;
  marca?: string | null;
  modelo?: string | null;
  capacidad_btu?: number | null;
  fecha_instalacion?: string | null;
  numero_serie?: string | null;
  tecnico_ids?: number[];
}) {
  const r = await fetch(`${API}/equipos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Equipo>;
}

export async function getEquipo(id: number) {
  const r = await fetch(`${API}/equipos/${id}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Equipo & { cliente_nombre?: string | null }>;
}

export async function getEquipoQr(id: number) {
  const r = await fetch(`${API}/equipos/${id}/qr`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ url: string; png_base64: string }>;
}

export async function postEquipoScore(id: number) {
  const r = await fetch(`${API}/equipos/${id}/score`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ score: number; score_actualizado: string | null }>;
}

export async function listHistorialServicios(equipoId: number) {
  const r = await fetch(`${API}/historial/${equipoId}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    equipo_id: number;
    items: Array<{
      tipo: string;
      id: number;
      fecha: string | null;
      tecnico: string;
      duracion_minutos: number | null;
      pdf_url: string | null;
      resumen: string;
    }>;
  }>;
}

export async function preventivoChecklist(tipo_equipo: string) {
  const r = await fetch(`${API}/preventivo/checklist`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tipo_equipo }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ items: string[] }>;
}

export async function preventivoGuardar(body: Record<string, unknown>) {
  const r = await fetch(`${API}/preventivo/guardar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean; id: number }>;
}

export async function correctivoDiagnostico(sintomas: string[], descripcion: string) {
  const r = await fetch(`${API}/correctivo/diagnostico`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sintomas, descripcion }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ causa_probable: string; pasos: string[] }>;
}

export async function correctivoGuardar(body: Record<string, unknown>) {
  const r = await fetch(`${API}/correctivo/guardar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean; id: number }>;
}

export async function listAlertas() {
  const r = await fetch(`${API}/alertas`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    alertas: Array<{
      tipo: string;
      equipo_id: number;
      equipo_nombre: string;
      cliente: string;
      detalle: string;
    }>;
  }>;
}

export async function dashboardAdmin() {
  const r = await fetch(`${API}/dashboard/admin`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Record<string, unknown>>;
}

export async function dashboardTecnico() {
  const r = await fetch(`${API}/dashboard/tecnico`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Record<string, unknown>>;
}

export async function dashboardCliente() {
  const r = await fetch(`${API}/dashboard/cliente`, { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Record<string, unknown>>;
}

export async function adminCrearUsuario(body: {
  nombre: string;
  email: string;
  password: string;
  rol: "tecnico" | "cliente" | "admin";
}) {
  const r = await fetch(`${API}/admin/usuarios`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Record<string, unknown>>;
}

export async function deleteEquipo(id: number) {
  const r = await fetch(`${API}/equipos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean }>;
}

export async function diagnostico(equipo: string, problema: string) {
  const r = await fetch(`${API}/diagnostico/generar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipo, problema }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    diagnostico: string;
    fuente: string;
    tokens_usados?: number | null;
  }>;
}

export async function guardar(data: {
  equipo_id: number;
  problema: string;
  tecnico?: string;
  fecha?: string;
  diagnostico: string;
  solucion?: string;
  riesgo?: string;
  tiempo_estimado?: string;
}) {
  const r = await fetch(`${API}/diagnostico/guardar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ ok: boolean }>;
}

export async function historial(equipoId?: number) {
  const q = equipoId != null ? `?equipo_id=${equipoId}` : "";
  const r = await fetch(`${API}/diagnostico/historial${q}`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Mantenimiento[]>;
}

export async function chat(messages: ChatMessage[], contextoCampo?: string) {
  const r = await fetch(`${API}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      contexto_campo: contextoCampo?.trim() || null,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ respuesta: string; tokens?: number | null }>;
}

export async function camara(
  imagen: string,
  pregunta: string,
  mime = "image/jpeg",
  modo: "diagnostico" | "placa" = "diagnostico"
) {
  const r = await fetch(`${API}/camara/analizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagen, pregunta, mime, modo }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{
    analisis: string;
    extraccion: Record<string, unknown> | null;
    modo: string;
    tokens?: number | null;
  }>;
}
