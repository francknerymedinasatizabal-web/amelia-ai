# Brief de diseño — Amelia (Central de Aires del Pacífico)

Documento para **diseño gráfico / UX** y para **desarrollo frontend**. Objetivo: unificar colores, animaciones, botones y estética sin perder funcionalidad ni accesibilidad en campo (móvil, técnicos en obra).

---

## 1. Qué es el producto

- **Nombre producto:** Amelia (asistente técnico HVAC).
- **Marca / empresa:** Central de Aires del Pacífico (CAP).
- **Uso real:** técnicos y administradores en **celular y escritorio**; clientes en portal solo lectura.
- **Contexto:** diagnóstico, equipos, preventivo/correctivo, chat, cámara (requiere HTTPS), dashboards por rol, QR en equipos.

El diseño debe priorizar **legibilidad**, **botones grandes** y **pocos pasos**; muchos usuarios trabajan con guantes, sol o pantallas pequeñas.

---

## 2. Stack técnico del frontend (para el diseñador)

| Herramienta | Uso |
|-------------|-----|
| **Next.js 15** (App Router) | Páginas y rutas |
| **Tailwind CSS** | Utilidades de color, espacio, tipografía |
| **Framer Motion** | Animaciones de entrada, hover en nav y cards |
| **React 19** | Componentes |
| **lucide-react** | Iconos |
| **Modo claro / oscuro** | `class="dark"` en `<html>` (toggle en navbar) |

Cualquier propuesta visual debería poder traducirse a **tokens** (colores, radios, sombras, espaciados) compatibles con Tailwind o CSS variables.

---

## 3. Paleta corporativa actual (hex)

Estos valores ya están en código; el diseñador puede proponer ajustes (contraste AA/AAA) manteniendo la identidad **navy + teal**.

| Token (código) | Hex | Uso típico |
|----------------|-----|------------|
| `brand.navy` | `#0f2744` | Textos fuertes, títulos, acentos oscuros |
| `brand.navy-deep` | `#071a2e` | Fondo navbar (glass), profundidad |
| `brand.teal` | `#0d9488` | Primario, enlaces, acentos |
| `brand.teal-bright` | `#14b8a6` | Hover, highlights |
| `brand.cyan` | `#22d3ee` | Acentos claros, gradientes |

**Fondo claro:** base aprox. `#f0fdfa` con **radiales suaves** (glow teal / navy).  
**Fondo oscuro:** base aprox. `#020617` con gradientes teal/navy.

---

## 4. Estilo visual actual (“look & feel”)

- **Glassmorphism:** tarjetas y paneles con `backdrop-blur`, bordes suaves `white/20`, sombras.
- **Gradientes:** botones y hero a menudo `from-brand-navy to-brand-teal`.
- **Bordes redondeados:** `rounded-xl` / `rounded-2xl` en formularios y cards.
- **Navbar:** sticky, fondo navy profundo semitransparente, links con estado activo en gradiente.
- **Logo:** monograma vectorial navy→teal; opcional PNG en `public/brand/cap-logo.png`.

---

## 5. Componentes reutilizables (puntos de unificación)

Conviene que el diseñador defina **estados** (default, hover, active, disabled, loading) para:

- **Botón primario** (CTA: guardar, finalizar, ir a diagnóstico).
- **Botón secundario** (outline / ghost).
- **Botón destructivo** (eliminar).
- **Inputs / selects** (formularios de equipos, login).
- **Card** (listados de equipos, dashboards).
- **Navbar** (por rol: técnico, admin, cliente).
- **Feedback:** errores (rojo suave), éxito (verde/teal), skeletons de carga.

Hoy muchos botones están **inline** en páginas; a futuro se pueden centralizar en un `<Button variant="…">` siguiendo el sistema del diseñador.

---

## 6. Pantallas principales (mapa para Figma)

| Ruta | Rol | Notas UX |
|------|-----|----------|
| `/login`, `/registro` | Público | Formularios simples |
| `/dashboard` | Todos (contenido distinto) | KPIs, alertas admin, equipos técnico/cliente |
| `/equipos`, `/equipos/[id]` | Técnico / admin / cliente (lectura) | Listado, ficha, QR, score de salud |
| `/preventivo`, `/correctivo` | Técnico / admin | Checklist, voz, PDF, botones grandes |
| `/diagnostico`, `/chat`, `/camara` | Técnico / admin | Flujos largos; cámara full UX móvil |

---

## 7. Animación (línea base)

- **Framer Motion:** entradas suaves (`opacity`, `y`), `whileHover` / `whileTap` en navbar y cards.
- **Transiciones CSS:** `transition-colors`, `duration-300` en tema y bordes.
- **Pedido al diseñador:** especificar **duraciones máximas** (ej. 200–400 ms), **easing**, y si se permiten animaciones “solo en desktop” para no cansar en campo.

---

## 8. Entregables deseables del diseñador

1. **Paleta final** (primario, secundario, superficie, texto, error, éxito) + modo oscuro.
2. **Tipografía:** familia(s), pesos, escalas (H1–body–caption) — hoy el layout usa sistema por defecto; se puede cambiar vía `next/font`.
3. **Component kit:** botones, inputs, cards, modales, toasts (aunque sea wireframe + estados).
4. **Espaciado y radios** (4/8 grid sugerido).
5. **Iconografía:** alinear con estilo lucide (trazo, grosor) o proponer set.
6. **Accesibilidad:** contraste mínimo **WCAG AA** en textos y botones; **área táctil ≥ 44px** en acciones frecuentes.

Formato recomendado: **Figma** con página “Tokens” + “Componentes” + “Flujos móvil”.

---

## 9. Qué hará desarrollo al recibir el diseño

- Traducir tokens a **Tailwind** (`theme.extend`) y/o **CSS variables** en `globals.css`.
- Unificar botones en componentes reutilizables si el sistema lo pide.
- Ajustar **Framer Motion** a la guía de motion (sin añadir latencia artificial).
- Revisar **responsive** en las rutas críticas (`/camara`, `/preventivo`, `/equipos/[id]`).

---

## 10. Contacto / contexto

- Repo: monorepo con `amelia-frontend/` (Next) y `amelia-backend/` (API).
- Despliegue típico: **Vercel** (front) + **Render** (API). Guía: `DEPLOY.md`.

---

*Última actualización: alineado con la implementación actual del frontend (Tailwind + Framer Motion + marca CAP).*
