import { Platform } from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// Planty — Sistema de diseño "Herbario"
// Dirección: editorial botánico premium. Tinta + papel + un verde de autor.
// Tipografía serif para títulos (aire de ficha de museo), sans para el resto.
// Esquinas cuadradas tipo iOS, bordes hairline, sin círculos de color decorativos.
// ─────────────────────────────────────────────────────────────────────────────

// Papel — modo claro cálido, sobrio.
export const LightColors = {
  primary: "#2F6B4F", // verde bosque profundo (no el mint tech anterior)
  secondary: "#3E8E6A",
  surface: "#F4F1EA", // papel cálido (no blanco puro)
  text: "#1B1D18", // tinta cálida casi negra
  error: "#A63A2E", // ladrillo apagado
  disabled: "#A8A6A0",
  pressed: "#24543E",
  onPrimary: "#FBFAF6",
  textSecondary: "#6E6F66",
  surfaceCard: "#FBF9F3", // panel apenas más claro que el papel
  border: "#E3DFD4", // hairline cálido
  accentWarm: "#B07C3A", // ocre apagado — solo señal semántica
  accentCool: "#3F6E78", // pizarra fría apagada
  accentLavender: "#6E6597",
} as const;

// Modo oscuro — protagonista en OLED. Negro cálido + verde luminoso.
export const DarkColors = {
  primary: "#6FBF95", // verde botánico luminoso (reemplaza el lima neón)
  secondary: "#4FAE83",
  surface: "#0C0E0B", // negro verdoso profundo
  text: "#ECEAE0", // blanco roto cálido
  error: "#E1786B", // coral apagado
  disabled: "#4A4D44",
  pressed: "#57A37C",
  onPrimary: "#0A0F0B", // texto oscuro sobre botón verde claro
  textSecondary: "#9DA093",
  surfaceCard: "#1F1D1A", // carbón cálido neutro (taupe), sin tinte verde
  border: "#302D29", // borde sutil neutro cálido
  accentWarm: "#D8A55A",
  accentCool: "#6FA8B5",
  accentLavender: "#A89BD6",
} as const;

export type ThemeMode = "light" | "dark";
export type ThemeColors = {
  [K in keyof typeof LightColors]: string;
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === "dark" ? DarkColors : LightColors;

export const Colors = LightColors;

// Familia serif del sistema para títulos y nombres de especie (estilo editorial).
// Georgia está presente en iOS y web; "serif" cubre Android.
const SerifFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
}) as string;

export const Fonts = {
  sans: "System",
  serif: SerifFamily,
} as const;

export const Typography = {
  family: "System",
  serif: SerifFamily,
  // Títulos editoriales en serif.
  display: {
    fontFamily: SerifFamily,
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  title: {
    fontFamily: SerifFamily,
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  // Subtítulos y cuerpo en sans para legibilidad.
  subtitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  // Etiqueta editorial: minúsculas espaciadas para overlines.
  overline: {
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Radios cuadrados tipo iOS (antes llegaban a 28 — demasiado redondo/infantil).
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Clínica — paleta de severidad clínica (tabs Estado / Historial / Reporte).
// Reutiliza los acentos del sistema "Herbario" en vez de colores genéricos de IA.
// ─────────────────────────────────────────────────────────────────────────────

export type ClinicHealthStatus = "saludable" | "atencion" | "enferma" | "critica";
export type ClinicIssueSeverity = "baja" | "media" | "alta";
export type ClinicIssueCategory = "plaga" | "enfermedad" | "deficiencia" | "exceso" | "ambiental";

const ClinicHealthColorsLight: Record<ClinicHealthStatus, string> = {
  saludable: LightColors.primary,
  atencion: LightColors.accentWarm,
  enferma: LightColors.error,
  critica: "#7A2418",
};

const ClinicHealthColorsDark: Record<ClinicHealthStatus, string> = {
  saludable: DarkColors.primary,
  atencion: DarkColors.accentWarm,
  enferma: DarkColors.error,
  critica: "#C24A3A",
};

const ClinicSeverityColorsLight: Record<ClinicIssueSeverity, string> = {
  baja: LightColors.accentCool,
  media: LightColors.accentWarm,
  alta: LightColors.error,
};

const ClinicSeverityColorsDark: Record<ClinicIssueSeverity, string> = {
  baja: DarkColors.accentCool,
  media: DarkColors.accentWarm,
  alta: DarkColors.error,
};

const ClinicCategoryColorsLight: Record<ClinicIssueCategory, string> = {
  plaga: LightColors.error,
  enfermedad: LightColors.accentLavender,
  deficiencia: LightColors.accentWarm,
  exceso: LightColors.accentCool,
  ambiental: LightColors.textSecondary,
};

const ClinicCategoryColorsDark: Record<ClinicIssueCategory, string> = {
  plaga: DarkColors.error,
  enfermedad: DarkColors.accentLavender,
  deficiencia: DarkColors.accentWarm,
  exceso: DarkColors.accentCool,
  ambiental: DarkColors.textSecondary,
};

export function getClinicColors(mode: ThemeMode) {
  return mode === "dark"
    ? { health: ClinicHealthColorsDark, severity: ClinicSeverityColorsDark, category: ClinicCategoryColorsDark }
    : { health: ClinicHealthColorsLight, severity: ClinicSeverityColorsLight, category: ClinicCategoryColorsLight };
}

export const DesignSystem = {
  Colors,
  Fonts,
  Typography,
  Spacing,
  BorderRadius,
} as const;
