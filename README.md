# Planty

Aplicación móvil de gestión y cuidado de plantas. Proyecto del curso EIF411 Diseño e Implementación de Plataformas Móviles, Universidad Nacional, Sede Regional Brunca.

Planty permite a un usuario autenticarse, registrar sus plantas, identificarlas mediante inteligencia artificial a partir de una fotografía y consultar información de cuidado. La aplicación está pensada para usarse en escenarios reales donde la conexión a internet no siempre es estable, por lo que contempla detección de estado de red y mensajes claros para el usuario cuando alguna función requiere conexión.

## Estructura del repositorio

```
planty-monorepo/
├── mobile/                  App Expo (React Native + TypeScript)
├── api/                     Backend FastAPI (Python)
├── serviceAccountKey.json   Credenciales Firebase Admin (no se commitea)
├── .gitignore
└── README.md
```

## Stack

La aplicación móvil está construida con Expo SDK 54, React Native 0.81 y TypeScript estricto. Utiliza expo-router para la navegación basada en archivos, Firebase Authentication y Firestore para autenticación y persistencia, React Hook Form con Zod para validación de formularios, y expo-camera junto con expo-media-library para la captura de fotografías. El backend está construido con FastAPI sobre Python 3.12, conectado a Firestore mediante Firebase Admin SDK, y desplegado en Render. La identificación de plantas se realiza llamando a Gemini 2.5 Flash a través del API de Google AI Studio.

## Cómo correr la aplicación móvil

```bash
cd mobile
npm install
npx expo start
```

Antes de arrancar, copiar `mobile/.env.example` a `mobile/.env` y configurar la variable EXPO_PUBLIC_API_URL apuntando al backend, ya sea local o en Render.

## Cómo correr el backend

```bash
cd api
python -m venv .venv
.venv\Scripts\activate       # Windows
source .venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Antes de arrancar, copiar `api/.env.example` a `api/.env` y configurar las variables FIREBASE_SERVICE_ACCOUNT_PATH y GEMINI_API_KEY. El archivo serviceAccountKey.json debe estar en la raíz del monorepo y nunca se commitea.

## Backend desplegado

El backend está disponible públicamente en Render. La URL del servicio se configura en la variable de entorno EXPO_PUBLIC_API_URL de la aplicación móvil. El endpoint /health responde con un JSON simple que confirma que el servicio está activo, y la documentación interactiva está disponible en /docs gracias a la integración nativa de FastAPI con Swagger UI.

## Módulos que funcionan sin conexión

Esta es una lista de los módulos de la aplicación clasificados según su comportamiento cuando no hay conexión. La justificación detallada de cada decisión está en el documento de la asignación 3.

Pantalla de inicio. Funciona sin conexión cuando los datos del usuario y de las plantas ya fueron cargados al iniciar sesión, ya que opera contra la cache local mantenida por el contexto de datos.

Pantalla Mis Plantas. Funciona sin conexión para consulta y edición. Los cambios realizados sin conexión quedarán en cola de sincronización y se aplicarán a Firestore cuando la conexión vuelva.

Pantalla Identificar. Requiere conexión obligatoriamente, ya que depende del backend y este a su vez del modelo de Gemini. Cuando no hay red se muestra un mensaje específico al usuario.

Pantalla Cuidado. Funciona sin conexión para consulta de recordatorios e historial cuando ya fueron descargados. Las acciones de marcar tareas como completadas quedan en cola.

Pantalla Perfil. Funciona sin conexión, opera sobre el documento de usuario cargado al iniciar sesión.

Formularios de edición de planta y de usuario. Funcionan sin conexión, los cambios se aplican localmente y se sincronizan al recuperar la red.

## Detección de conexión

La aplicación utiliza la librería @react-native-community/netinfo para escuchar cambios en el estado de la red en tiempo real. El componente OfflineBanner se renderiza dentro del layout autenticado y se hace visible automáticamente cuando se pierde la conexión, mostrando un mensaje que indica al usuario que está sin conexión y que algunos datos pueden no estar actualizados. El banner desaparece cuando la conexión se restablece.

## Almacenamiento local

El proyecto adopta expo-sqlite como capa de almacenamiento local, justificado por el modelo relacional natural de la aplicación con múltiples colecciones interrelacionadas. La justificación completa, incluyendo la comparación con AsyncStorage, MMKV, WatermelonDB y Realm, está en el documento de la asignación 3.

## Reglas del repositorio

Nunca se commitean los archivos de credenciales serviceAccountKey.json ni archivos .env. Los archivos de configuración local de cada herramienta de desarrollo tampoco se incluyen en el repositorio. Los commits siguen el formato convencional con prefijos como feat, fix, refactor, docs o chore.
