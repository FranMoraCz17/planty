# Planty — Contexto del Proyecto para Claude

## ¿Qué es este proyecto?
Aplicación móvil de gestión y cuidado de plantas desarrollada como proyecto del curso **Diseño e Implementación de Plataformas Móviles**. Monorepo con una app Expo (React Native) y una API REST (FastAPI + Firebase).

---

## Estructura del Monorepo

```
planty/
├── apps/
│   ├── mobile/          → App Expo (React Native + TypeScript)
│   └── api/             → Backend FastAPI (Python)
├── serviceAccountKey.json  → Firebase Admin credentials (NUNCA commitear)
├── .gitignore
├── README.md
└── CLAUDE.md            → Este archivo
```

---

## apps/mobile — Expo App

### Stack
- **Framework**: Expo ~54 + React Native 0.81
- **Routing**: expo-router (file-based)
- **Auth + DB**: Firebase 12 (Auth + Firestore)
- **Forms**: React Hook Form + Zod
- **Animaciones**: Reanimated 4 + Gesture Handler
- **Lenguaje**: TypeScript estricto

### Pantallas
- `/(auth)/` → Login y registro (Firebase Auth)
- `/(app)/(tabs)/` → 5 tabs principales:
  1. **Inicio** — Dashboard con accesos rápidos (datos demo)
  2. **Mis Plantas** — CRUD completo con Firestore
  3. **Identificar** — UI preparada, funcionalidad pendiente
  4. **Cuidado** — Recordatorios (datos mock, sin lógica real)
  5. **Perfil** — Datos de usuario + plantas y ubicaciones
- `/(app)/forms/` → Edición de usuario y planta (React Hook Form + Zod)

### Archivos clave
| Archivo | Propósito |
|---|---|
| `contexts/DemoDataProvider.tsx` | Context global: sincroniza Firebase Auth + datos de usuario/plantas |
| `services/plantService.ts` | CRUD de plantas en Firestore |
| `services/userService.ts` | CRUD de usuario en Firestore |
| `constants/designSystem.ts` | Sistema de diseño centralizado (colores, tipografía, espaciado) |
| `constants/formSchemas.ts` | Schemas Zod compartidos |

### Componentes reutilizables
- `FormTextInput` — Input con React Hook Form
- `FormNotice` — Notificaciones de formulario
- `ThemedButton` — Botón con soporte tema claro/oscuro

### Estado actual
| Feature | Estado |
|---|---|
| Auth completa (Firebase Auth) | ✅ Completo |
| CRUD de plantas (Firestore) | ✅ Completo |
| Edición de perfil | ✅ Completo |
| Sistema de diseño + tema dark/light | ✅ Completo |
| Módulo de cámara (identificación) | 🔲 0% — UI preparada |
| Sistema de recordatorios | 🔲 0% — Solo mock |
| Settings | 🔲 ~10% |

---

## apps/api — FastAPI Backend

### Stack
- **Framework**: FastAPI 0.116.1
- **Runtime**: Python 3.12 + uvicorn
- **DB**: Firebase Admin → Firestore (lado servidor)
- **Config**: python-dotenv

### Archivos clave
| Archivo | Propósito |
|---|---|
| `main.py` | Entry point — crea la app FastAPI |
| `app/config.py` | Settings con lru_cache (host, port, CORS, Firebase path) |
| `app/firebase.py` | Inicialización Firebase Admin + cliente Firestore |
| `app/services.py` | `get_document()` y `get_collection()` — acceso genérico a Firestore |
| `app/models.py` | Modelos Pydantic de respuesta |
| `app/routes.py` | Todos los endpoints REST |

### Endpoints
```
GET /health
GET /api/users/{userId}
GET /api/users/{userId}/profile
GET /api/users/{userId}/plants
GET /api/plants/{plantId}
GET /api/users/{userId}/categories
GET /api/users/{userId}/plant-tags
GET /api/users/{userId}/care-schedule
GET /api/users/{userId}/care-history
GET /api/users/{userId}/stats
GET /api/users/{userId}/info-tiles
GET /api/collections/{collectionName}   ← solo para desarrollo
```

### Variables de entorno (apps/api/.env)
```env
API_HOST=127.0.0.1
API_PORT=8000
API_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=../../serviceAccountKey.json
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

### Cómo correr el backend
```bash
cd apps/api
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
Proyecto del curso **Diseño e Implementación de Plataformas Móviles**. Las asignaciones del profesor llegan como guías en Notion. Cuando se comparta una guía nueva, incorporarla como tarea en este archivo.

### Tareas Pendientes
- [ ] Incorporar laboratorio actual (pendiente de enunciado del profesor)
- [ ] Completar integración con Google (Auth)
- [ ] Módulo de cámara para identificación de plantas
- [ ] Sistema de recordatorios real (reemplazar mocks)
