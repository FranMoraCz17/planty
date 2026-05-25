/* eslint-disable @typescript-eslint/no-require-imports */

// Mock de react-native-reanimated (requerido por la libreria oficial)
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

// Silenciar warnings de animacion nativa en entorno Jest
jest.mock(
  "react-native/Libraries/Animated/NativeAnimatedHelper",
  () => ({}),
  { virtual: true },
);

// Mock global de firebase/auth: cada test puede sobreescribir el comportamiento
jest.mock("firebase/auth", () => ({
  __esModule: true,
  initializeAuth: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock de @firebase/auth (require dinamico en firebaseConfig)
jest.mock("@firebase/auth", () => ({
  __esModule: true,
  initializeAuth: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  __esModule: true,
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock("firebase/firestore", () => ({
  __esModule: true,
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// AsyncStorage usado por firebaseConfig
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// expo-router: Link como passthrough, useRouter como objeto con metodos jest.fn
jest.mock("expo-router", () => {
  const React = require("react");
  const Link = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    Link,
    Stack: { Screen: () => null },
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    usePathname: () => "/",
  };
});

// ThemeProvider: devolver colores deterministicos
jest.mock("@/src/theme/ThemeProvider", () => ({
  __esModule: true,
  useAppTheme: () => ({
    colors: {
      surface: "#FFFFFF",
      surfaceCard: "#F4F4F5",
      primary: "#16A34A",
      onPrimary: "#FFFFFF",
      text: "#0A0A0A",
      textSecondary: "#525252",
      border: "#E5E5E5",
      disabled: "#A1A1AA",
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));
