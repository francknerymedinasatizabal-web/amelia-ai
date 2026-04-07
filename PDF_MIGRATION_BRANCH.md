# Rama `pdf-migration` (solo local / staging)

**No desplegar a producción** hasta revisar QA.

En tu PC (con Git instalado), desde la raíz del repo:

```bash
git status
git checkout main
git pull
git checkout -b pdf-migration
```

Luego instala dependencias del frontend y prueba PDF en `/preventivo` y `/correctivo`:

```bash
cd amelia-frontend
npm install
npm run build
```

Cuando valide el equipo, merge a `main` y recién entonces despliega Vercel/Render.
