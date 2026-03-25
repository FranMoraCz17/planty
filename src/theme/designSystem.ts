export const LightColors = {
  primary: "#16A34A",
  secondary: "#84C64A",
  surface: "#ECF8F3",
  text: "#12342E",
  error: "#E25D50",
  disabled: "#9DB7AF",
  pressed: "#12917A",
  onPrimary: "#FFFFFF",
  textSecondary: "#4F6F68",
  surfaceCard: "#F9FFFC",
  border: "#CFE5DD",
  accentWarm: "#F6A623",
  accentCool: "#7FC8D6",
  accentLavender: "#B9B6E8",
} as const;

export const DarkColors = {
  primary: "#16A34A",
  secondary: "#7EBF46",
  surface: "#0F1C19",
  text: "#E5F3EE",
  error: "#EA756A",
  disabled: "#567068",
  pressed: "#15856E",
  onPrimary: "#FFFFFF",
  textSecondary: "#A4BBB3",
  surfaceCard: "#172825",
  border: "#2A3D37",
  accentWarm: "#E4A640",
  accentCool: "#64AEBB",
  accentLavender: "#8D88C2",
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
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    lineHeight: 32,
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
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const DesignSystem = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} as const;
