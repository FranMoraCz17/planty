export const Colors = {
  primary: "#2F6F46",
  secondary: "#6E9F63",
  surface: "#F5F8F1",
  text: "#1E2D22",
  error: "#C13A37",
  disabled: "#A7B7AA",
  pressed: "#215133",
  onPrimary: "#FFFFFF",
  textSecondary: "#5F6F62",
  surfaceCard: "#FFFFFF",
  border: "#D9E1D5",
} as const;

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
