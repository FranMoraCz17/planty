import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseAuth = require("@firebase/auth") as {
  getAuth: (app?: unknown) => Auth;
  initializeAuth: (
    app: unknown,
    deps?: { persistence?: unknown },
  ) => Auth;
  getReactNativePersistence: (storage: unknown) => unknown;
};

const firebaseConfig = {
  apiKey: "AIzaSyDYzf-dscJhHAoEUa6jLFII-vcaj410OY4",
  authDomain: "planty-e5806.firebaseapp.com",
  projectId: "planty-e5806",
  storageBucket: "planty-e5806.firebasestorage.app",
  messagingSenderId: "503465462261",
  appId: "1:503465462261:web:ba4eeb7a99489a5d30f8bc",
  measurementId: "G-8BJ5SW3RTZ",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;

try {
  authInstance = firebaseAuth.initializeAuth(app, {
    persistence: firebaseAuth.getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = firebaseAuth.getAuth(app);
}

export const auth: Auth = authInstance;
export const db = getFirestore(app);
