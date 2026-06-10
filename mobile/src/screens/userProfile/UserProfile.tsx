import React, { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/firebaseConfig";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import FormNotice from "@/src/components/forms/FormNotice";
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
    () => plants.filter((p) => parseFrequencyDays(p.wateringFrequencyLabel) === null).length,
    [plants],
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero — foto grande con gradiente y nombre flotando */}
        <View style={styles.heroWrap}>
          {currentUser.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.heroPhoto}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.heroPhoto, styles.heroPhotoPlaceholder]}>
              <MaterialCommunityIcons name="account-circle-outline" size={80} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          <View style={styles.heroGradient} />

          {/* Nombre e identidad flotando sobre el gradiente */}
          <View style={styles.heroIdentity}>
            <Text style={styles.heroName}>{currentUser.name}</Text>
            <Text style={styles.heroUsername}>@{currentUser.username}</Text>
          </View>

          {/* Boton cambiar foto */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            onPress={() => void changePhoto()}
            disabled={isUploading}
            style={({ pressed }) => [styles.heroEditPhotoBtn, pressed && { opacity: 0.7 }]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="camera-outline" size={16} color="#fff" />
            )}
          </Pressable>

          {/* Settings arriba a la derecha */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push("/(app)/settings")}
            style={({ pressed }) => [styles.heroSettingsBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color="#fff" />
          </Pressable>

          {/* Herbario — libro arriba a la izquierda */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver mi herbario"
            onPress={() => router.push("/herbario" as never)}
            style={({ pressed }) => [styles.heroHerbariumBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color="#fff" />
          </Pressable>
        </View>

        {photoError && (
          <FormNotice
            variant="error"
            title="No se pudo cambiar la foto"
            message={photoError}
            onDismiss={resetError}
          />
        )}

        {/* Acciones rápidas */}
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            onPress={() => router.push("/(app)/forms/user")}
            style={({ pressed }) => [styles.actionBtnPrimary, pressed && { opacity: 0.85 }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.onPrimary} />
            <Text style={styles.actionBtnPrimaryText}>Editar perfil</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar planta"
            onPress={() => router.push("/(app)/forms/plant?mode=create")}
            style={({ pressed }) => [styles.actionBtnSecondary, pressed && { opacity: 0.85 }]}
          >
            <MaterialCommunityIcons name="plus" size={15} color={colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Agregar planta</Text>
          </Pressable>
        </View>

        {/* Stats reales */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plantas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{areas.length}</Text>
            <Text style={styles.statLabel}>Areas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{healthPct}%</Text>
            <Text style={styles.statLabel}>Analizadas</Text>
          </View>
        </View>

        {/* Salud de coleccion */}
        {plants.length > 0 && (
          <View style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <Text style={styles.healthTitle}>Salud de la colección</Text>
              <Text style={styles.healthPct}>{healthPct}%</Text>
            </View>
            <View style={styles.healthBarWrap}>
              <View style={[styles.healthBarFill, { width: `${healthPct}%` as `${number}%` }]} />
            </View>
            <View style={styles.healthMeta}>
              <View style={styles.healthChip}>
                <MaterialCommunityIcons name="leaf-circle" size={12} color={colors.primary} />
                <Text style={styles.healthChipText}>{plants.filter((p) => p.aiAnalyzed).length} analizadas</Text>
              </View>
              {withoutWatering > 0 && (
                <View style={[styles.healthChip, styles.healthChipWarn]}>
                  <MaterialCommunityIcons name="water-off-outline" size={12} color={colors.accentWarm} />
                  <Text style={[styles.healthChipText, { color: colors.accentWarm }]}>{withoutWatering} sin riego</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Areas del usuario */}
        {areas.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>Mis áreas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areasScroll}>
              {areas.map((area) => {
                const plantCount = plants.filter((p) => p.areaId === area.id).length;
                return (
                  <View key={area.id} style={styles.areaChip}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.primary} />
                    <Text style={styles.areaChipName} numberOfLines={1}>{area.name}</Text>
                    <Text style={styles.areaChipCount}>{plantCount}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Menu de accesos directos */}
        <View style={styles.menuCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/herbario" as never)}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + "22" }]}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={styles.menuTitle}>Mi Herbario</Text>
              <Text style={styles.menuSubtitle}>Fichas botánicas de tus especies</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(app)/clinic" as never)}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.accentWarm + "22" }]}>
              <MaterialCommunityIcons name="stethoscope" size={18} color={colors.accentWarm} />
            </View>
            <View style={styles.menuBody}>
              <Text style={styles.menuTitle}>Clínica Fitopatológica</Text>
              <Text style={styles.menuSubtitle}>Diagnósticos e historial de salud</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(app)/settings")}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.textSecondary + "22" }]}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.menuBody}>
              <Text style={styles.menuTitle}>Configuración</Text>
              <Text style={styles.menuSubtitle}>Apariencia, notificaciones y privacidad</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Cerrar sesion */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesion"
          onPress={() => void signOut(auth)}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }]}
        >
          <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
          <Text style={styles.signOutBtnText}>Cerrar sesión</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
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
    },
    emptyTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    content: {
      paddingBottom: 120,
      gap: Spacing.md,
    },
    heroWrap: {
      width: "100%",
      height: 300,
      backgroundColor: isDark ? "#0F1A0F" : "#1A2E1A",
      position: "relative",
    },
    heroPhoto: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    heroPhotoPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1A2E1A" : "#2D4A2D",
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    heroIdentity: {
      position: "absolute",
      bottom: Spacing.lg,
      left: Spacing.lg,
      right: Spacing.lg,
      gap: 4,
    },
    heroName: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroUsername: {
      color: "rgba(255,255,255,0.75)",
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "600",
    },
    heroEditPhotoBtn: {
      position: "absolute",
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroSettingsBtn: {
      position: "absolute",
      top: Spacing.lg,
      right: Spacing.lg,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroHerbariumBtn: {
      position: "absolute",
      top: Spacing.lg,
      left: Spacing.lg,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    actionsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    actionBtnPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
    },
    actionBtnPrimaryText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      backgroundColor: colors.surfaceCard,
    },
    actionBtnSecondaryText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statDivider: {
      width: 1,
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
    healthCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    healthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    healthTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
    healthPct: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 16,
      fontWeight: "800",
    },
    healthBarWrap: {
      height: 6,
      backgroundColor: isDark ? "#22332F" : "#E5F3EE",
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
    healthChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
    },
    healthChipWarn: {
      backgroundColor: isDark ? "#241D0E" : "#FEF3C7",
    },
    healthChipText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
    },
    sectionWrap: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.xs,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    areasScroll: {
      gap: Spacing.xs,
      paddingVertical: 2,
    },
    areaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    areaChipName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "700",
      maxWidth: 100,
    },
    areaChipCount: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },
    menuCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: Spacing.md + 44,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    menuBody: {
      flex: 1,
      gap: 1,
    },
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
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDark ? "#3A1414" : "#FECACA",
      backgroundColor: isDark ? "#1A0A0A" : "#FEF2F2",
    },
    signOutBtnText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
  });
