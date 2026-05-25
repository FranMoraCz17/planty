import React, { useMemo, useState } from "react";
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
import ThemedButton from "@/src/components/ui/ThemedButton";

type CollectionView = "plantas" | "sitios";

export default function UserProfile() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUser, currentUserId, getPlantsByUser, refreshCurrentUser } =
    useDemoData();
  const styles = createStyles(colors, isDark);

  const { isUploading, error: photoError, changePhoto, resetError } =
    useProfilePhoto({
      userId: currentUserId,
      onUploaded: () => {
        void refreshCurrentUser();
      },
    });

  const [collectionView, setCollectionView] = useState<CollectionView>("plantas");
  const plants = getPlantsByUser(currentUserId);
  const uniqueSites = useMemo(
    () => Array.from(new Set(plants.map((plant) => plant.locationName))),
    [plants],
  );

  const siteMetadata: Record<string, { luz: string; humedad: string }> = {
    "Patio trasero": { luz: "Sol parcial", humedad: "Alta" },
    "Sala principal": { luz: "Luz filtrada", humedad: "Media" },
    Cocina: { luz: "Luz indirecta", humedad: "Media" },
    "Sala norte": { luz: "Luz brillante", humedad: "Media" },
    Dormitorio: { luz: "Luz suave", humedad: "Media" },
  };

  const mySites = uniqueSites.map((siteName, index) => ({
    id: `site-${index}`,
    nombre: siteName,
    luz: siteMetadata[siteName]?.luz ?? "Luz variable",
    humedad: siteMetadata[siteName]?.humedad ?? "Media",
  }));

  const highlightedPlant = plants[0] ?? null;

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No hay datos de perfil disponibles</Text>
            <Text style={styles.emptyStateBody}>La capa de datos no encontro un usuario inicial.</Text>
          </View>
          <ThemedButton
            label="Cerrar sesion"
            accessibilityLabel="Cerrar sesion"
            onPress={() => void signOut(auth)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Perfil</Text>
            <Text style={styles.headerSubtitle}>Resumen de cuenta y coleccion</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push("/(app)/settings")}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.settingsButtonText}>Ajustes</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          {photoError && (
            <FormNotice
              variant="error"
              title="No se pudo cambiar la foto"
              message={photoError}
              onDismiss={resetError}
            />
          )}
          <View style={styles.heroTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              onPress={() => void changePhoto()}
              disabled={isUploading}
              style={({ pressed }) => [
                styles.avatarWrap,
                pressed && !isUploading && styles.avatarPressed,
              ]}
            >
              {currentUser.avatarUrl ? (
                <Image
                  source={{ uri: currentUser.avatarUrl }}
                  style={styles.avatarImage}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <MaterialCommunityIcons
                  name="account-outline"
                  size={30}
                  color={colors.onPrimary}
                />
              )}
              {isUploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.onPrimary} />
                </View>
              ) : (
                <View style={styles.avatarBadge}>
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={14}
                    color={colors.onPrimary}
                  />
                </View>
              )}
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <Text style={styles.profileAlias}>@{currentUser.username}</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{currentUser.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{currentUser.city}</Text>
              </View>
            </View>
          </View>
          <View style={styles.quickActionsRow}>
            <ThemedButton
              accessibilityLabel="Editar perfil"
              label="Editar perfil"
              onPress={() => router.push("/(app)/forms/user")}
              style={styles.primaryAction}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar planta"
              onPress={() => router.push("/(app)/forms/plant?mode=create")}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
              ]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Agregar planta</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plantas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mySites.length}</Text>
            <Text style={styles.statLabel}>Sitios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentUser.pendingCount}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.cardTitle}>Estado actual</Text>
          {highlightedPlant ? (
            <>
              <Text style={styles.highlightTitle}>{highlightedPlant.name}</Text>
              <Text style={styles.highlightBody}>
                Ubicada en {highlightedPlant.locationName} con riego {highlightedPlant.wateringFrequencyLabel.toLowerCase()}.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${highlightedPlant.name}`}
                onPress={() => router.push(`/(app)/forms/plant?id=${highlightedPlant.id}`)}
                style={({ pressed }) => [
                  styles.inlineAction,
                  pressed && styles.inlineActionPressed,
                ]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={styles.inlineActionText}>Editar planta destacada</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.highlightTitle}>Coleccion lista para completar</Text>
              <Text style={styles.highlightBody}>
                Agrega una planta nueva para mostrar historial y ubicaciones dentro del perfil.
              </Text>
            </>
          )}
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
            {plants.map((plant) => (
              <View key={plant.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <MaterialCommunityIcons name="leaf" size={18} color={colors.onPrimary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{plant.name}</Text>
                  <Text style={styles.itemSubtitle}>{plant.scientificName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaChip}>{plant.locationName}</Text>
                    <Text style={styles.metaChip}>{plant.wateringFrequencyLabel}</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel={`Editar ${plant.name}`}
                  accessibilityRole="button"
                  onPress={() => router.push(`/(app)/forms/plant?id=${plant.id}`)}
                  style={({ pressed }) => [styles.inlineEditButton, pressed && styles.inlineEditButtonPressed]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                </Pressable>
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
    emptyState: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    emptyStateTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    emptyStateBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    heroCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    heroTop: {
      flexDirection: "row",
      gap: Spacing.md,
      alignItems: "center",
    },
    avatarWrap: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },
    avatarPressed: {
      opacity: 0.85,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surfaceCard,
      alignItems: "center",
      justifyContent: "center",
    },
    profileInfo: {
      flex: 1,
      gap: 3,
    },
    profileName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight + 2,
    },
    profileAlias: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    infoText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    primaryAction: {
      flex: 1,
    },
    secondaryAction: {
      flex: 1,
      minHeight: 48,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#1D2F2A" : "#EDF8F4",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.md,
    },
    secondaryActionPressed: {
      opacity: 0.85,
    },
    secondaryActionText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
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
    highlightCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    cardTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
      textTransform: "uppercase",
    },
    highlightTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 3,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight + 2,
    },
    highlightBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    inlineAction: {
      marginTop: Spacing.xs,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#20352F" : "#E5F3EE",
    },
    inlineActionPressed: {
      opacity: 0.85,
    },
    inlineActionText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
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
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: 2,
    },
    metaChip: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#20352F" : "#E5F3EE",
      overflow: "hidden",
    },
    metaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    inlineEditButton: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineEditButtonPressed: {
      backgroundColor: isDark ? "#223630" : "#E8F4EF",
    },
  });
