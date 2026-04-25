export const LightColors = {
  primary: "#10B981",
  secondary: "#34D399",
  surface: "#FAFAFA",
  text: "#0A0A0A",
  error: "#EF4444",
  disabled: "#A1A1AA",
  pressed: "#059669",
  onPrimary: "#FFFFFF",
  textSecondary: "#52525B",
  surfaceCard: "#FFFFFF",
  border: "#E4E4E7",
  accentWarm: "#F59E0B",
  accentCool: "#06B6D4",
  accentLavender: "#8B5CF6",
} as const;

export const DarkColors = {
  primary: "#A3E635",
  secondary: "#84CC16",
  surface: "#0A0A0A",
  text: "#FAFAFA",
  error: "#F87171",
  disabled: "#52525B",
  pressed: "#65A30D",
  onPrimary: "#0A0A0A",
  textSecondary: "#A1A1AA",
  surfaceCard: "#161616",
  border: "#27272A",
  accentWarm: "#FBBF24",
  accentCool: "#22D3EE",
  accentLavender: "#A78BFA",
} as const;

export type ThemeMode = "light" | "dark";
export type ThemeColors = {
  [K in keyof typeof LightColors]: string;
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === "dark" ? DarkColors : LightColors;

export const Colors = LightColors;

export const Typography = {
  family: "System",
  display: {
    fontSize: 34,
    fontWeight: "800" as const,
    lineHeight: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
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

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const DesignSystem = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} as const;
