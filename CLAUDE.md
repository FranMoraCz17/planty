# Planty — Contexto del Proyecto para Claude

## ¿Qué es este proyecto?
Aplicación móvil de gestión y cuidado de plantas desarrollada como proyecto del curso **Diseño e Implementación de Plataformas Móviles**. Monorepo con una app Expo (React Native) y una API REST (FastAPI + Firebase).

---

## Estructura del Monorepo

```
planty-monorepo/
├── mobile/              → App Expo (React Native + TypeScript)
├── api/                 → Backend FastAPI (Python)
├── serviceAccountKey.json  → Firebase Admin credentials (NUNCA commitear)
├── .gitignore
├── README.md
└── CLAUDE.md            → Este archivo
```

---

## mobile/ — Expo App

### Stack
- **Framework**: Expo ~54 + React Native 0.81
- **Routing**: expo-router (file-based)
- **Auth + DB**: Firebase 12 (Auth + Firestore)
- **Forms**: React Hook Form + Zod
- **Lenguaje**: TypeScript estricto

### Pantallas
- `/(auth)/` → Login y registro (Firebase Auth)
- `/(app)/(tabs)/` → 5 tabs principales:
  1. **Inicio** — Dashboard con accesos rápidos
  2. **Mis Plantas** — CRUD completo con Firestore
  3. **Identificar** — Cámara + identificación con Gemini Vision IA
  4. **Cuidado** — Recordatorios (datos mock)
  5. **Perfil** — Datos de usuario + plantas y ubicaciones
- `/(app)/forms/` → Edición de usuario y planta (React Hook Form + Zod)

### Archivos clave
| Archivo | Propósito |
|---|---|
| `src/data/DemoDataProvider.tsx` | Context global: sincroniza Firebase Auth + datos de usuario/plantas |
| `src/services/plantService.ts` | CRUD de plantas en Firestore |
| `src/services/userService.ts` | CRUD de usuario en Firestore |
| `src/services/permissionService.ts` | Gestión de permisos de cámara y galería |
| `src/services/cameraService.ts` | Captura de foto, base64, flash, rotación |
| `src/services/identifyService.ts` | Llama al backend para identificar planta con IA |
| `src/hooks/useCamera.ts` | Hook que coordina permisos y cámara |
| `src/hooks/useNetworkStatus.ts` | Detecta conexión a internet en tiempo real |
| `src/theme/designSystem.ts` | Sistema de diseño centralizado (colores, tipografía, espaciado) |
| `src/features/forms/formSchemas.ts` | Schemas Zod compartidos |

### Componentes reutilizables
- `FormTextInput` — Input con React Hook Form
- `FormNotice` — Notificaciones de formulario
- `ThemedButton` — Botón con soporte tema claro/oscuro
- `OfflineBanner` — Banner visible cuando no hay conexión

### Variables de entorno (mobile/.env)
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Estado actual
| Feature | Estado |
|---|---|
| Auth completa (Firebase Auth) | ✅ Completo |
| CRUD de plantas (Firestore) | ✅ Completo |
| Edición de perfil | ✅ Completo |
| Sistema de diseño + tema dark/light | ✅ Completo |
| Módulo de cámara + identificación con IA | ✅ Completo |
| Detección offline + banner | ✅ Completo |
| Sistema de recordatorios | 🔲 Solo mock |
| Settings | 🔲 ~10% |

---

## api/ — FastAPI Backend

### Stack
- **Framework**: FastAPI 0.116.1
- **Runtime**: Python 3.12 + uvicorn
- **DB**: Firebase Admin → Firestore (lado servidor)
- **IA**: Gemini Vision API (identificación de plantas)
- **Config**: python-dotenv
- **Deploy**: Render

### Archivos clave
| Archivo | Propósito |
|---|---|
| `main.py` | Entry point — crea la app FastAPI |
| `app/config.py` | Settings con lru_cache (host, port, CORS, Firebase path, Gemini key) |
| `app/firebase.py` | Inicialización Firebase Admin + cliente Firestore |
| `app/services.py` | `get_document()` y `get_collection()` — acceso genérico a Firestore |
| `app/models.py` | Modelos Pydantic de respuesta |
| `app/routes.py` | Todos los endpoints REST |

### Endpoints
```
GET  /health
GET  /api/users/{userId}
GET  /api/users/{userId}/profile
GET  /api/users/{userId}/plants
GET  /api/plants/{plantId}
GET  /api/users/{userId}/categories
GET  /api/users/{userId}/plant-tags
GET  /api/users/{userId}/care-schedule
GET  /api/users/{userId}/care-history
GET  /api/users/{userId}/stats
GET  /api/users/{userId}/info-tiles
GET  /api/collections/{collectionName}   ← solo para desarrollo
POST /api/identify-plant                 ← identificación con Gemini Vision
```

### Variables de entorno (api/.env)
```env
API_HOST=127.0.0.1
API_PORT=8000
API_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=../serviceAccountKey.json
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Cómo correr el backend
```bash
cd api
python -m venv .venv
source .venv/bin/activate        # Mac/Linux
# .venv\Scripts\activate         # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## Reglas del Proyecto

### Git
- **NUNCA** commitear `serviceAccountKey.json`
- **NUNCA** commitear archivos `.env`
- **NUNCA** commitear `__pycache__/`, `.venv/`, `node_modules/`
- **NUNCA** commitear `.claude/` ni `memory/`
- **NUNCA** incluir firma de Claude en mensajes de commit

### Convenciones de código (mobile)
- TypeScript estricto — sin `any` implícitos
- Componentes funcionales con hooks
- Estilos vía `designSystem.ts`, nunca colores hardcodeados
- Schemas de validación centralizados en `formSchemas.ts`

### Convenciones de código (api)
- Type hints en todas las funciones
- Modelos Pydantic para todas las respuestas
- `lru_cache` para singletons (settings, firestore client)
- Errores con `HTTPException` apropiados

---

## Contexto del Curso
Proyecto del curso **Diseño e Implementación de Plataformas Móviles** — EIF411, Universidad Nacional, Sede Regional Brunca. Profesor: Daniel Granados Murillo.

### Laboratorios
- [x] Lab 1 — Estructura base, navegación, UI/UX, tema dark/light
- [x] Lab 2 — Formularios RHF + Zod, CRUD Firebase real
- [ ] Lab 3 — Cámara + IA (Gemini), deploy en Render, offline UX (en progreso)
