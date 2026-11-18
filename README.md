# Planty 🌿

A cross-platform mobile app for plant collection management, AI-powered health diagnosis, and care scheduling. Built as a course project for **EIF411 – Mobile Platform Design & Implementation** at Universidad Nacional de Costa Rica.

---

## Features

- **Plant Collection** — add, edit, and organize plants with photos, care notes, and location areas
- **AI Identification & Diagnosis** — Gemini Vision API identifies species and generates phytopathological health reports (issues, severity level, immediate actions, estimated recovery)
- **Phytopathological Clinic** — cross-plant diagnostics view sortable by urgency/severity; full diagnosis history timeline per plant with expandable detail cards
- **Care Calendar** — day-strip scheduling with an immersive full-screen task modal; iOS-style slide-to-confirm interactions and a rain animation on watering tasks
- **Herbarium & Search** — browse species with glass-card UI and filter pills
- **Favorites** — save daily plant facts locally via AsyncStorage
- **Auth & Profile** — Firebase Auth (email/password); user profile with photo gallery and photo bleed-fade effect
- **Dark / Light mode** — system-aware theming with in-app toggle
- **Custom "liquid glass" UI** — animated tab bar with spring physics, blur sheets, fullscreen gallery viewer, image bleed-fade component

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK ~54, Expo Router 6, React Native 0.81, React 19, TypeScript (strict) |
| State | React Context API + `useState` |
| Forms | react-hook-form + Zod |
| Auth & DB | Firebase Auth, Firestore, Firebase Storage |
| AI | Gemini Vision API (Google AI Studio) |
| Backend | FastAPI (Python 3.11) + Firebase Admin SDK — deployed on Render |
| Local storage | AsyncStorage |
| Animations | React Native Animated API (spring, PanResponder) |
| Styling | Custom design system in `designSystem.ts` — no external UI library |

---

## Structure

```
planty-monorepo/
├── mobile/          # Expo app
│   ├── app/         # Expo Router — routing and layouts only
│   └── src/
│       ├── components/   # UI components (GlassCard, AnimatedTabBar, PhotoDetailSheet…)
│       ├── screens/      # Screen logic (CalendarScreen, ClinicScreen, CollectionScreen…)
│       ├── services/     # Firebase/API calls (plantService, diagnoseService…)
│       ├── hooks/        # Custom hooks (usePlantPhoto, useCamera…)
│       └── theme/        # Design tokens and ThemeProvider
├── api/             # FastAPI backend
└── docs/            # Architecture notes and assignment docs
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the mobile app
cd mobile && npx expo start

# Start the backend
cd api && python -m uvicorn main:app --reload --port 8000
```

You'll need a `mobile/.env` with your Firebase config keys and `GEMINI_API_KEY`.

---

## Author

Francisco Mora Cabezas — [github.com/FranMoraCz17](https://github.com/FranMoraCz17)  
EIF411, UNA Brunca · 2026
