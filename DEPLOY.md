# Guía de despliegue — proyecto Amelia (completo)

## Vista general

| Parte | Carpeta | Dónde se despliega | Rol |
|--------|---------|-------------------|-----|
| Frontend | `amelia-frontend/` | **Vercel** | Next.js 15, UI, cámara (requiere HTTPS) |
| Backend | `amelia-backend/` | **Render** (Web Service) | FastAPI, JWT, OpenAI, SQLAlchemy |
| Base de datos | — | **Render** (PostgreSQL) | Datos persistentes en producción |

Flujo recomendado: **GitHub** → **PostgreSQL en Render** → **API en Render** → **Frontend en Vercel** → ajustar **CORS** con la URL de Vercel.

**IMPORTANTE — orden de deploy:** desplegar **primero el backend** (Postgres + API en Render, con variables listas y `GET /health` OK) y **después el frontend** en Vercel con `NEXT_PUBLIC_API_URL`. Así evitas un primer deploy del front apuntando a un API inexistente o sin CORS.

Referencias de variables: `amelia-backend/.env.example` y `amelia-frontend/.env.example`.

### Checklist rápida (producción)

| Paso | Acción |
|------|--------|
| 1 | Subir repo a GitHub (`amelia-frontend/` + `amelia-backend/`). |
| 2 | **Render → PostgreSQL** → copiar Internal Database URL. |
| 3 | **Render → Web Service** → root `amelia-backend`, build/start según §3, health `/health`. |
| 4 | Verificación explícita: **`GET /health`** → debe responder JSON con **`"status": "ok"`** (y `"ok": true`). Si no, el deploy está “muerto” o mal configurado. |
| 5 | **Vercel** → root `amelia-frontend`, env `NEXT_PUBLIC_API_URL` = URL del API **sin** `/` final. |
| 6 | En Render (API): `CORS_ORIGINS` = URL(s) de Vercel; **`PUBLIC_APP_URL`** = URL pública del frontend (QR y `/equipos/{id}`). |
| 7 | Login web, ficha de equipo / QR. |

**Variables críticas entre servicios**

| Dónde | Variable | Valor típico |
|--------|-----------|----------------|
| Vercel | `NEXT_PUBLIC_API_URL` | `https://tu-api.onrender.com` |
| Render (API) | `PUBLIC_APP_URL` | `https://tu-app.vercel.app` (sin `/` final) |
| Render (API) | `CORS_ORIGINS` | Producción + previews, p. ej. `https://tu-app.vercel.app,https://tu-app-git-main-tuusuario.vercel.app` |

**Importancia (API / Render)**

| Variable | Nivel | Nota |
|----------|--------|------|
| `JWT_SECRET` | Crítica | Sin un secreto fuerte y estable, login y tokens fallan o son inseguros. |
| `DATABASE_URL` | Crítica | Sin base de datos el API no persiste datos. |
| `OPENAI_API_KEY` | Crítica | Requerida para IA (diagnóstico, chat, score, checklists, etc.). |
| `CORS_ORIGINS` | Alta | Debe incluir el origen exacto del navegador (prod y previews si las usas). |
| `PUBLIC_APP_URL` | Alta | QR y enlaces de equipo; debe coincidir con la URL pública de Vercel. |

Antes de subir: en local, `npm install && npm run build` en `amelia-frontend` y `pip install -r requirements.txt` en `amelia-backend`. El deploy en GitHub usa la rama que conectes (merge a `main` antes si trabajas en ramas como `pdf-migration`).

### Configuración local (evitar URLs “a mano”)

| Entorno | Archivo | Variable clave |
|---------|---------|------------------|
| Frontend | `amelia-frontend/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:8000` |
| Backend | `amelia-backend/.env` | `PUBLIC_APP_URL=http://localhost:3000` (QR y enlaces al abrir fichas) |

En **producción**, sustituye por las URLs reales de Render y Vercel. El frontend solo debe conocer el API vía `NEXT_PUBLIC_*`; el backend usa `PUBLIC_APP_URL` para generar el texto del QR.

---

## Requisitos previos

- Cuenta en [GitHub](https://github.com), [Render](https://render.com) y [Vercel](https://vercel.com).
- Clave **OpenAI** (`OPENAI_API_KEY`).
- En tu PC (solo para desarrollo local o migración): **Node.js** (LTS) en `amelia-frontend` (`npm install`), **Python 3.11** en `amelia-backend` (`pip install -r requirements.txt`).
- No subas `.env` al repo; usa solo los `.env.example` como plantilla.

---

## 1. Subir el código a GitHub

En la raíz del monorepo (`amelia-frontend/` + `amelia-backend/`):

```bash
git init
git add .
git commit -m "Amelia CAP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

---

## 2. PostgreSQL en Render

1. **New** → **PostgreSQL**.
2. Crea la instancia (nombre y región a tu gusto).
3. Copia **Internal Database URL** (formato `postgres://` o `postgresql://`).

---

## 3. Web Service del API (Render)

1. **New** → **Web Service** → conecta el mismo repositorio.
2. **Root Directory:** `amelia-backend`
3. **Runtime:** Python 3.11 (coherente con `amelia-backend/runtime.txt`).
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Health Check Path:** `/health`

### Variables de entorno (obligatorias)

| Variable | Importancia | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | Crítica | Internal Database URL del Postgres (el backend normaliza `postgres://` a `psycopg2` si hace falta). |
| `OPENAI_API_KEY` | Crítica | Clave de OpenAI. |
| `JWT_SECRET` | **Crítica** | Secreto largo y aleatorio para firmar JWT. **Sin esto, login y tokens no funcionan de forma fiable.** |

### Variables recomendadas

| Variable | Ejemplo |
|----------|---------|
| `PUBLIC_APP_URL` | URL del frontend en Vercel, **sin** `/` final (ej. `https://tu-app.vercel.app`). Genera enlaces de QR y fichas `…/equipos/{id}`. |
| `COMPANY_NAME` | `Central de Aires del Pacífico` |
| `ASSISTANT_NAME` | `Amelia` |
| `CORS_ORIGINS` | Producción + previews: `https://tu-app.vercel.app,https://tu-app-git-main-tuusuario.vercel.app` (ajusta a tu proyecto). En pruebas rápidas puedes usar `*`. |

7. Lanza el deploy y espera estado **Live**.
8. Anota la URL pública del API, p. ej. `https://amelia-api-xxxx.onrender.com` (**sin** `/` al final).

Comprueba: `GET https://TU-API.onrender.com/health` → debe responder **`{"status":"ok","ok":true}`** (si no hay `status`, el servicio no está alineado con la versión actual del repo).

### Migrar datos desde SQLite (opcional)

Si tienes `amelia.db` local y quieres volcar datos a Postgres:

1. Copia `amelia.db` dentro de `amelia-backend/` si hace falta.
2. En tu máquina, con dependencias del backend instaladas y `DATABASE_URL` apuntando al Postgres de Render (URL externa si la usas desde fuera de Render).

```bash
cd amelia-backend
# Windows (cmd):
set DATABASE_URL=postgresql+psycopg2://USER:PASS@HOST:5432/DBNAME
# PowerShell:
# $env:DATABASE_URL="postgresql+psycopg2://..."
python scripts/migrate_sqlite_to_postgres.py
```

El script **borra** tablas en Postgres y reimporta desde SQLite: haz backup antes.

### Primer usuario administrador

En Render → Postgres → **Shell** o cliente SQL:

```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'tu@email.com';
```

---

## 4. Frontend en Vercel

**Después** de que el API en Render esté **Live** y `/health` responda bien (orden explicado arriba).

1. **Add New Project** → importa el **mismo** repo.
2. **Root Directory:** `amelia-frontend`
3. **Framework:** Next.js (detección automática).
4. Variable de entorno:

| Nombre | Valor |
|--------|--------|
| `NEXT_PUBLIC_API_URL` | URL del API del paso 3, **sin barra final** (ej. `https://amelia-api-xxxx.onrender.com`) |

5. **Deploy**.

Vercel sirve el sitio en **HTTPS** (necesario para que la **cámara** funcione en el navegador).

Hay un `amelia-frontend/vercel.json` con región `iad1`; puedes ajustarla si lo necesitas.

---

## 5. Cerrar CORS (producción)

Cuando tengas la URL de producción de Vercel (ej. `https://tu-app.vercel.app`):

1. Render → Web Service del API → **Environment**.
2. `CORS_ORIGINS` = origen(es) exacto(s), separados por coma si hay varios (producción + previews):

   `https://tu-app.vercel.app,https://tu-app-git-main-usuario.vercel.app`

3. Guarda y redeploy (manual o automático).

Evita dejar `*` en producción si puedes: limita a tus dominios de Vercel.

---

## 6. Comprobar en producción

- **`GET /health`** → `{"status":"ok","ok":true}`  
- Registro / login  
- Equipos, diagnóstico, chat  
- Cámara (solo con HTTPS)  
- PDF / informes  

Si ves errores de CORS, revisa que `CORS_ORIGINS` coincida con la URL de la barra de direcciones (`https`, dominio, sin path).

---

## 7. Actualizar el despliegue

- **Frontend:** cada `git push` a la rama conectada en Vercel dispara un nuevo deploy.
- **Backend:** igual en Render al hacer push al repo (según la rama configurada).
- Si cambias la URL del API, actualiza `NEXT_PUBLIC_API_URL` en Vercel y vuelve a desplegar el frontend.

---

## 8. Blueprint `render.yaml` (opcional)

En la raíz hay un `render.yaml` de ejemplo para crear el Web Service desde un Blueprint. **No** crea Postgres: lo habitual es crear la base a mano (paso 2) y asignar `DATABASE_URL` en el servicio (paso 3).

---

## Resumen de URLs y variables

| Servicio | Qué guardar |
|----------|-------------|
| Render Postgres | `DATABASE_URL` interna → variable del API en Render |
| Render API | URL pública del API → `NEXT_PUBLIC_API_URL` en Vercel |
| Vercel | URL pública del sitio → `PUBLIC_APP_URL` y `CORS_ORIGINS` en el API |
