# Planty

A mobile application for plant management and care built with Expo, FastAPI, and AI-powered plant identification.

> Academic project — EIF411 Mobile Platform Design and Implementation, Universidad Nacional, Sede Regional Brunca.

---

## Overview

Planty lets authenticated users register their plants, identify new ones from a photo using AI, and track care routines. The app is designed for real-world usage where internet connectivity isn't always reliable — it detects network state, queues changes made offline, and syncs them automatically when the connection is restored.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, TypeScript (strict) |
| Navigation | Expo Router (file-based routing) |
| Auth & DB | Firebase Authentication + Firestore |
| Forms | React Hook Form + Zod |
| Camera | expo-camera, expo-media-library |
| Local storage | expo-sqlite |
| Network detection | @react-native-community/netinfo |
| Backend | FastAPI, Python 3.12, Firebase Admin SDK |
| AI | Gemini 2.5 Flash via Google AI Studio API |
| Deployment | Render (backend) |

---

## Repository Structure

```
planty-monorepo/
├── mobile/       Expo app (React Native + TypeScript)
├── api/          FastAPI backend (Python)
├── .gitignore
└── README.md
```

---

## Getting Started

### Mobile app

1. Copy the environment file and configure the backend URL:

```bash
cp mobile/.env.example mobile/.env
# Set EXPO_PUBLIC_API_URL to your local or Render backend URL
```

2. Install dependencies and start the dev server:

```bash
cd mobile
npm install
npx expo start
```

### Backend

1. Copy the environment file and configure credentials:

```bash
cp api/.env.example api/.env
# Set FIREBASE_SERVICE_ACCOUNT_PATH and GEMINI_API_KEY
# Place serviceAccountKey.json at the monorepo root (never commit it)
```

2. Create a virtual environment, install dependencies, and run:

```bash
cd api
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend exposes a `/health` endpoint and interactive API docs at `/docs` (Swagger UI).

---

## Offline Support

Planty handles connectivity gracefully across all screens. An `OfflineBanner` component renders inside the authenticated layout and appears automatically whenever the network is lost, disappearing once the connection is restored.

| Screen | Offline behavior |
|---|---|
| Home | Works offline — reads from the local cache populated at login |
| My Plants | Full read and edit access offline; changes are queued and synced on reconnect |
| Identify | Requires connection — depends on the backend and Gemini; shows a clear message when offline |
| Care | Read access to reminders and history; task completions are queued |
| Profile | Works offline — reads from the user document loaded at login |
| Edit forms (plant & user) | Work offline; changes are applied locally and synced on reconnect |

### Why expo-sqlite?

The app's data model is relational by nature (users → plants → care events → reminders). expo-sqlite was chosen over AsyncStorage, MMKV, WatermelonDB, and Realm because it fits this structure natively without extra abstraction layers or licensing constraints.

---

## Repository Rules

- Never commit `serviceAccountKey.json` or any `.env` files.
- Commits follow the Conventional Commits format (`feat`, `fix`, `refactor`, `docs`, `chore`).
