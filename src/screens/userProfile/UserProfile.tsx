import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

type CollectionView = "plantas" | "sitios";

const profile = {
  nombre: "Fran Mora",
  alias: "fran.botanica",
  ciudad: "Perez Zeledon, Costa Rica",
  coleccion: 18,
  pendientes: 6,
  racha: 41,
} as const;

const myPlants = [
  {
    id: "pl-1",
    nombre: "Hortensia",
    nombreBotanico: "Hydrangea macrophylla",
    ubicacion: "Patio trasero",
    riego: "Cada 3 dias",
  },
  {
    id: "pl-2",
    nombre: "Lirio de la paz",
    nombreBotanico: "Spathiphyllum cochlearispathum",
    ubicacion: "Sala principal",
    riego: "Cada 7 dias",
  },
  {
    id: "pl-3",
    nombre: "Potos",
    nombreBotanico: "Epipremnum aureum",
    ubicacion: "Cocina",
    riego: "Cada 7 dias",
  },
] as const;

const mySites = [
  { id: "st-1", nombre: "Patio trasero", luz: "Sol parcial", humedad: "Alta" },
  { id: "st-2", nombre: "Sala principal", luz: "Luz filtrada", humedad: "Media" },
  { id: "st-3", nombre: "Cocina", luz: "Luz indirecta", humedad: "Media" },
] as const;

export default function UserProfile() {
  const { colors, mode, isDark, toggleTheme } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [showSettings, setShowSettings] = useState(false);
  const [collectionView, setCollectionView] = useState<CollectionView>("plantas");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Perfil</Text>
            <Text style={styles.headerSubtitle}>Control de cuenta y coleccion</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
            onPress={() => setShowSettings((prev) => !prev)}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.settingsButtonText}>Ajustes</Text>
          </Pressable>
        </View>

        {showSettings && (
          <View style={styles.settingsPanel}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsTextWrap}>
                <Text style={styles.settingsTitle}>Tema visual</Text>
                <Text style={styles.settingsBody}>Modo actual: {mode === "dark" ? "Oscuro" : "Claro"}</Text>
              </View>
              <ThemedButton
                label={mode === "dark" ? "Pasar a claro" : "Pasar a oscuro"}
                accessibilityLabel="Cambiar tema de la aplicacion"
                onPress={toggleTheme}
                style={styles.settingsAction}
              />
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.quickSettingsRow}>
              <View style={styles.quickChip}>
                <MaterialCommunityIcons name="bell-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.quickChipText}>Notificaciones activas</Text>
              </View>
              <View style={styles.quickChip}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.quickChipText}>Privacidad estandar</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <MaterialCommunityIcons name="account-off-outline" size={28} color={colors.onPrimary} />
            <Text style={styles.avatarHint}>Sin foto</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.nombre}</Text>
            <Text style={styles.profileAlias}>@{profile.alias}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText}>{profile.ciudad}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.coleccion}</Text>
            <Text style={styles.statLabel}>Plantas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.racha}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>

        <View style={styles.segmentWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver plantas"
            onPress={() => setCollectionView("plantas")}
            style={[styles.segmentButton, collectionView === "plantas" && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, collectionView === "plantas" && styles.segmentTextActive]}>
              Plantas
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver sitios"
            onPress={() => setCollectionView("sitios")}
            style={[styles.segmentButton, collectionView === "sitios" && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, collectionView === "sitios" && styles.segmentTextActive]}>
              Sitios
            </Text>
          </Pressable>
        </View>

        {collectionView === "plantas" ? (
          <View style={styles.listWrap}>
            {myPlants.map((plant) => (
              <View key={plant.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <MaterialCommunityIcons name="leaf" size={18} color={colors.onPrimary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{plant.nombre}</Text>
                  <Text style={styles.itemSubtitle}>{plant.nombreBotanico}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{plant.ubicacion}</Text>
                    <Text style={styles.metaDot}>-</Text>
                    <Text style={styles.metaText}>{plant.riego}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.textSecondary} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.listWrap}>
            {mySites.map((site) => (
              <View key={site.id} style={styles.itemCard}>
                <View style={[styles.itemIcon, styles.siteIcon]}>
                  <MaterialCommunityIcons name="home-floor-1" size={18} color={colors.onPrimary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{site.nombre}</Text>
                  <Text style={styles.itemSubtitle}>Luz: {site.luz}</Text>
                  <Text style={styles.metaText}>Humedad: {site.humedad}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.md,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 4,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    settingsButton: {
      minHeight: 42,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: Spacing.md,
    },
    settingsButtonPressed: {
      backgroundColor: colors.pressed,
    },
    settingsButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    settingsPanel: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    settingsTextWrap: {
      flex: 1,
      gap: 2,
    },
    settingsTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    settingsBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    settingsAction: {
      minWidth: 132,
      paddingHorizontal: Spacing.sm,
    },
    settingsDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    quickSettingsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      flexWrap: "wrap",
    },
    quickChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#233730" : "#E8F4EF",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    quickChipText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    profileCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    avatarWrap: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    avatarHint: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
      opacity: 0.92,
    },
    profileInfo: {
      flex: 1,
      gap: 2,
    },
    profileName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    profileAlias: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
    },
    locationText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
      alignItems: "center",
      gap: 2,
    },
    statValue: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    statLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    segmentWrap: {
      backgroundColor: isDark ? "#20352F" : "#DFF0EA",
      borderRadius: BorderRadius.md,
      padding: 4,
      flexDirection: "row",
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: BorderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentButtonActive: {
      backgroundColor: colors.surfaceCard,
    },
    segmentText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
      lineHeight: Typography.body.lineHeight,
    },
    segmentTextActive: {
      color: colors.text,
      fontWeight: "700",
    },
    listWrap: {
      gap: Spacing.sm,
    },
    itemCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    itemIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    siteIcon: {
      backgroundColor: colors.accentCool,
    },
    itemContent: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    itemSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    metaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    metaDot: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
  });
