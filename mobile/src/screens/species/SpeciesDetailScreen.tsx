import { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PlantsCatalogService, {
  type PlantCatalogCategory,
  type PlantCatalogItem,
} from "@/src/services/plantsCatalogService";
import SpeciesInfoService, {
  type SpeciesInfo,
} from "@/src/services/speciesInfoService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const CATEGORY_COLORS: Record<PlantCatalogCategory, string> = {
  domestica: "#16A34A",
  agricola: "#B45309",
  hortaliza: "#65A30D",
  aromatica: "#0E7490",
  ornamental: "#A21CAF",
  arbol: "#4D7C0F",
};

export default function SpeciesDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sci?: string; common?: string }>();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const scientificName = params.sci ?? "";
  const fallbackCommonName = params.common ?? "";

  // Buscamos los metadatos en el dataset offline (categoria, family, tags).
  const datasetMatch: PlantCatalogItem | null = useMemo(() => {
    if (!scientificName) return null;
    const all = PlantsCatalogService.getAll();
    return (
      all.find(
        (p) =>
          p.scientificName.toLowerCase() === scientificName.toLowerCase(),
      ) ?? null
    );
  }, [scientificName]);

  const commonName =
    datasetMatch?.commonName ?? fallbackCommonName ?? scientificName;

  const [info, setInfo] = useState<SpeciesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void SpeciesInfoService.fetchInfo(scientificName)
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scientificName]);

  const handleAddToCollection = () => {
    const q = new URLSearchParams({
      mode: "create",
      prefillCommon: commonName,
      prefillSci: scientificName,
    }).toString();
    router.push(`/(app)/forms/plant?${q}`);
  };

  const photoUri = info?.photoUri ?? info?.thumbnailUri ?? null;
  const categoryColor = datasetMatch
    ? CATEGORY_COLORS[datasetMatch.category]
    : colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto */}
        <View style={styles.heroImageWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} size="large" />
              ) : (
                <MaterialCommunityIcons
                  name="leaf"
                  size={64}
                  color={colors.onPrimary}
                />
              )}
            </View>
          )}
        </View>

        {/* Identidad */}
        <View style={styles.identityBlock}>
          <Text style={styles.commonName}>{commonName}</Text>
          <Text style={styles.scientificName}>{scientificName}</Text>

          <View style={styles.chipsRow}>
            {datasetMatch ? (
              <>
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryChipText}>
                    {PlantsCatalogService.getCategoryLabel(
                      datasetMatch.category,
                    )}
                  </Text>
                </View>
                <View style={styles.familyChip}>
                  <Text style={styles.familyChipText}>
                    {datasetMatch.family}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Descripcion Wikipedia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acerca de</Text>
            <Text style={styles.sectionSource}>Fuente: Wikipedia</Text>
          </View>
          {isLoading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : info?.extract ? (
            <Text style={styles.extractText}>{info.extract}</Text>
          ) : (
            <Text style={styles.noInfoText}>
              No encontramos descripcion publica para esta especie. Igual podes
              agregarla a tu coleccion.
            </Text>
          )}

          {info?.wikipediaUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leer mas en Wikipedia"
              onPress={() => {
                void Linking.openURL(info.wikipediaUrl as string);
              }}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons
                name="open-in-new"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.linkText}>Leer mas en Wikipedia</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Etiquetas del dataset */}
        {datasetMatch && datasetMatch.tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caracteristicas</Text>
            <View style={styles.tagsRow}>
              {datasetMatch.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* CTA flotante */}
      <View style={styles.ctaWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar a mi coleccion"
          onPress={handleAddToCollection}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialCommunityIcons
            name="bookmark-plus-outline"
            size={20}
            color={colors.onPrimary}
          />
          <Text style={styles.ctaButtonText}>Agregar a mi coleccion</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "700",
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 120,
      gap: Spacing.lg,
    },
    heroImageWrap: {
      width: "100%",
      aspectRatio: 16 / 10,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.primary,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    identityBlock: {
      gap: Spacing.xs,
    },
    commonName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 12,
      fontWeight: "800",
      letterSpacing: -0.5,
      lineHeight: Typography.body.lineHeight + 12,
    },
    scientificName: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontStyle: "italic",
      fontWeight: "500",
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    categoryChip: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    categoryChipText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    familyChip: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    familyChipText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    section: {
      gap: Spacing.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    sectionSource: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },
    extractText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight + 4,
      fontWeight: "500",
    },
    noInfoText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontStyle: "italic",
      lineHeight: Typography.body.lineHeight,
    },
    loadingBlock: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: Spacing.xs,
    },
    linkText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    tagPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
    },
    tagText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    ctaWrap: {
      position: "absolute",
      left: Spacing.lg,
      right: Spacing.lg,
      bottom: Spacing.xl,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    ctaButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "800",
    },
  });
