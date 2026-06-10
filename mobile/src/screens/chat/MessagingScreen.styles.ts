import { StyleSheet } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";

export const createStyles = (colors: ThemeColors, _isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.lg,
      padding: Spacing.xl,
    },
    centeredText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
    retryBtn: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
    },
    retryText: {
      ...Typography.body,
      color: colors.onPrimary,
      fontWeight: "700",
    },
    // ── Header ──
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BorderRadius.full,
    },
    headerBody: { flex: 1 },
    headerTitle: { ...Typography.subtitle, color: colors.text },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
    },
    // ── Secciones ──
    sectionLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    // ── Fila ──
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarGroup: {
      backgroundColor: colors.primary,
    },
    avatarText: {
      ...Typography.subtitle,
      color: colors.onPrimary,
    },
    rowBody: { flex: 1 },
    rowTitle: { ...Typography.body, color: colors.text, fontWeight: "700" },
    rowSubtitle: { ...Typography.caption, color: colors.textSecondary },
    rowDot: {
      width: 9,
      height: 9,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.surface,
      position: "absolute",
      right: 0,
      bottom: 0,
    },
    avatarWrap: { position: "relative" },
    emptyMembers: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
  });
