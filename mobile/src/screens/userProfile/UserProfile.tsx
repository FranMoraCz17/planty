import React, { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/firebaseConfig";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import FormNotice from "@/src/components/forms/FormNotice";
import PhotoDetailSheet from "@/src/components/ui/PhotoDetailSheet";
import GlassIconButton from "@/src/components/ui/GlassIconButton";
import { useProfilePhoto } from "@/src/hooks/useProfilePhoto";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

function parseFrequencyDays(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) && days > 0 ? days : null;
}

type MenuItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export default function UserProfile() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUser, currentUserId, getPlantsByUser, areas, refreshCurrentUser } =
    useDemoData();
  const styles = createStyles(colors, isDark);

  const { isUploading, error: photoError, changePhoto, resetError } =
    useProfilePhoto({
      userId: currentUserId,
      onUploaded: () => {
        void refreshCurrentUser();
      },
    });

  const plants = getPlantsByUser(currentUserId);

  const healthPct = useMemo(() => {
    if (plants.length === 0) return 0;
    const analyzed = plants.filter((p) => p.aiAnalyzed).length;
    return Math.round((analyzed / plants.length) * 100);
  }, [plants]);

  const withoutWatering = useMemo(
    () =>
      plants.filter((p) => parseFrequencyDays(p.wateringFrequencyLabel) === null)
        .length,
    [plants],
  );

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>Sin datos de perfil</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesion"
          onPress={() => void signOut(auth)}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.signOutBtnText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  const menuItems: MenuItem[] = [
    {
      icon: "book-open-page-variant-outline",
      title: "Mi Herbario",
      subtitle: "Fichas botánicas de tus especies",
      onPress: () => router.push("/herbario" as never),
    },
    {
      icon: "stethoscope",
      title: "Clínica fitopatológica",
      subtitle: "Diagnósticos e historial de salud",
      onPress: () => router.push("/(app)/clinic" as never),
    },
    {
      icon: "cog-outline",
      title: "Configuración",
      subtitle: "Apariencia, notificaciones y privacidad",
      onPress: () => router.push("/(app)/settings"),
    },
  ];

  return (
    <PhotoDetailSheet
      photoUri={currentUser.avatarUrl ?? null}
      placeholderIcon="account-circle-outline"
      snapPoints={["55%", "92%"]}
      actions={
        <>
          <GlassIconButton
            icon="book-open-page-variant-outline"
            accessibilityLabel="Ver mi herbario"
            onPress={() => router.push("/herbario" as never)}
          />
          <GlassIconButton
            icon={isUploading ? undefined : "camera-outline"}
            loading={isUploading}
            accessibilityLabel="Cambiar foto de perfil"
            onPress={() => void changePhoto()}
          />
          <GlassIconButton
            icon="cog-outline"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push("/(app)/settings")}
          />
        </>
      }
    >
      {/* Identidad */}
      <Text style={styles.name}>{currentUser.name}</Text>
      <Text style={styles.username}>@{currentUser.username}</Text>

      {photoError ? (
        <FormNotice
          variant="error"
          title="No se pudo cambiar la foto"
          message={photoError}
          onDismiss={resetError}
        />
      ) : null}

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
          onPress={() => router.push("/(app)/forms/user")}
          style={({ pressed }) => [styles.actionPrimary, pressed && { opacity: 0.85 }]}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={15}
            color={colors.onPrimary}
          />
          <Text style={styles.actionPrimaryText}>Editar perfil</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar planta"
          onPress={() => router.push("/(app)/forms/plant?mode=create")}
          style={({ pressed }) => [styles.actionSecondary, pressed && { opacity: 0.85 }]}
        >
          <MaterialCommunityIcons name="plus" size={15} color={colors.primary} />
          <Text style={styles.actionSecondaryText}>Agregar planta</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{plants.length}</Text>
          <Text style={styles.statLabel}>Plantas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{areas.length}</Text>
          <Text style={styles.statLabel}>Áreas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{healthPct}%</Text>
          <Text style={styles.statLabel}>Analizadas</Text>
        </View>
      </View>

      {/* Salud de la colección */}
      {plants.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.healthHeader}>
            <Text style={styles.sectionTitle}>Salud de la colección</Text>
            <Text style={styles.healthPct}>{healthPct}%</Text>
          </View>
          <View style={styles.healthBarWrap}>
            <View
              style={[styles.healthBarFill, { width: `${healthPct}%` as `${number}%` }]}
            />
          </View>
          <View style={styles.healthMeta}>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="leaf" size={12} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>
                {plants.filter((p) => p.aiAnalyzed).length} analizadas
              </Text>
            </View>
            {withoutWatering > 0 ? (
              <View style={styles.metaChip}>
                <MaterialCommunityIcons
                  name="water-off-outline"
                  size={12}
                  color={colors.accentWarm}
                />
                <Text style={[styles.metaChipText, { color: colors.accentWarm }]}>
                  {withoutWatering} sin riego
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Mis áreas */}
      {areas.length > 0 ? (
        <View style={styles.areasWrap}>
          <Text style={styles.overline}>MIS ÁREAS</Text>
          <View style={styles.areasChipsRow}>
            {areas.map((area) => {
              const plantCount = plants.filter((p) => p.areaId === area.id).length;
              return (
                <Pressable
                  key={area.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Área ${area.name}`}
                  onPress={() => router.push(`/(app)/forms/area?id=${area.id}`)}
                  style={({ pressed }) => [styles.areaChip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.areaChipName} numberOfLines={1}>
                    {area.name}
                  </Text>
                  <Text style={styles.areaChipCount}>{plantCount}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Accesos — lista iOS sobria, sin círculos de color */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <View key={item.title}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={item.onPress}
              style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.menuBody}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
            {i < menuItems.length - 1 ? <View style={styles.menuDivider} /> : null}
          </View>
        ))}
      </View>

      {/* Cerrar sesión */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesion"
        onPress={() => void signOut(auth)}
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }]}
      >
        <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
        <Text style={styles.signOutBtnText}>Cerrar sesión</Text>
      </Pressable>
    </PhotoDetailSheet>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    centered: { alignItems: "center", justifyContent: "center", gap: Spacing.lg },
    emptyTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },

    // ── Identidad ──
    name: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: -0.5,
      lineHeight: 36,
    },
    username: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "600",
    },

    // ── Acciones ──
    actionsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    actionPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
    },
    actionPrimaryText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
    actionSecondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
    },
    actionSecondaryText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },

    // ── Stats ──
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      paddingVertical: Spacing.md,
    },
    statCell: { flex: 1, alignItems: "center", gap: 2 },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: colors.border,
    },
    statValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    statLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    // ── Secciones translúcidas ──
    section: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    healthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    healthPct: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 16,
      fontWeight: "800",
    },
    healthBarWrap: {
      height: 6,
      backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      borderRadius: 3,
      overflow: "hidden",
    },
    healthBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    healthMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    },
    metaChipText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
    },

    // ── Áreas ──
    areasWrap: { gap: Spacing.xs },
    overline: { ...Typography.overline, color: colors.textSecondary },
    areasChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    areaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: BorderRadius.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    areaChipName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "700",
      maxWidth: 120,
    },
    areaChipCount: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },

    // ── Menú iOS ──
    menuCard: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: Spacing.lg + 20 + Spacing.md,
    },
    menuBody: { flex: 1, gap: 1 },
    menuTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    menuSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },

    // ── Cerrar sesión ──
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(225,120,107,0.4)" : "rgba(166,58,46,0.3)",
      backgroundColor: isDark ? "rgba(225,120,107,0.08)" : "rgba(166,58,46,0.05)",
      marginTop: Spacing.xs,
    },
    signOutBtnText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
  });
