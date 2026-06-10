import { StyleSheet } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";

export const createStyles = (colors: ThemeColors, isDark: boolean) =>
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
    // ── Header ──────────────────────────────────────────────────────────────
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
    headerBody: {
      flex: 1,
    },
    headerTitle: {
      ...Typography.subtitle,
      color: colors.text,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
    },
    // ── Lista de mensajes ───────────────────────────────────────────────────
    list: {
      flex: 1,
    },
    listContent: {
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    emptyWrap: {
      paddingVertical: Spacing.xxxl,
      alignItems: "center",
      gap: Spacing.sm,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
    // ── Burbujas ────────────────────────────────────────────────────────────
    bubbleRow: {
      maxWidth: "82%",
    },
    bubbleRowMine: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    bubbleRowOther: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    senderName: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: "700",
      marginBottom: 2,
      marginLeft: Spacing.sm,
    },
    bubble: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: BorderRadius.sm,
    },
    bubbleOther: {
      backgroundColor: colors.surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderBottomLeftRadius: BorderRadius.sm,
    },
    bubbleTextMine: {
      ...Typography.body,
      color: colors.onPrimary,
    },
    bubbleTextOther: {
      ...Typography.body,
      color: colors.text,
    },
    timestamp: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
      marginHorizontal: Spacing.sm,
    },
    // ── Indicador "escribiendo" ─────────────────────────────────────────────
    typingText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontStyle: "italic",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    // ── Barra de envío ──────────────────────────────────────────────────────
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    input: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      maxHeight: 120,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.disabled,
    },
    statusBanner: {
      paddingVertical: Spacing.xs,
      alignItems: "center",
      backgroundColor: isDark ? colors.surfaceCard : colors.border,
    },
    statusBannerText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    // ── Meta del mensaje (hora + checks + temporal) ─────────────────────────
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginTop: 2,
      marginHorizontal: Spacing.sm,
    },
    ttlBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    // ── Menú de opciones del mensaje ────────────────────────────────────────
    optionsBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BorderRadius.full,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
    optionsCard: {
      marginTop: 64,
      marginRight: Spacing.lg,
      width: 290,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    optionsTitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    optionBody: { flex: 1 },
    optionTitle: {
      ...Typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    optionSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    optionValue: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    ttlChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    ttlChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    ttlChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "22",
    },
    ttlChipText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    ttlChipTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    optionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
