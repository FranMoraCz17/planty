# 🌿 Planty — Monorepo

Aplicación móvil de gestión y cuidado de plantas.  
Proyecto del curso **Diseño e Implementación de Plataformas Móviles**.

## Estructura

```
planty/
├── apps/
│   ├── mobile/     → App Expo (React Native + TypeScript)
│   └── api/        → API REST (FastAPI + Python)
├── serviceAccountKey.json   ← NO commitear
├── .gitignore
└── CLAUDE.md       → Contexto completo del proyecto para Claude
```

## Inicio rápido

### Mobile (Expo)
```bash
cd apps/mobile
npm install
npx expo start
```

### API (FastAPI)
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

> Asegúrate de tener `serviceAccountKey.json` en la raíz del monorepo  
> y un archivo `apps/api/.env` basado en `apps/api/.env.example`.

## Documentación completa

Ver [`CLAUDE.md`](./CLAUDE.md) para contexto completo del proyecto, stack, endpoints, y convenciones.
