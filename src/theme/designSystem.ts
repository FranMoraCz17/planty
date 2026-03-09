export const Colors = {
  primary: "#2E7D32",
  primaryPressed: "#1B5E20",
  primaryDisabled: "#A5D6A7",

  secondary: "#81C784",

  surface: "#F9FBF7",
  surfaceCard: "#FFFFFF",

  text: "#1C1C1E",
  textSecondary: "#6B6B6B",
  textOnPrimary: "#FFFFFF",

  error: "#D32F2F",
  errorDisabled: "#EF9A9A",

  border: "#E0E0E0",
};

export const Typography = {
  family: "System",

  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
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
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 999,
};
