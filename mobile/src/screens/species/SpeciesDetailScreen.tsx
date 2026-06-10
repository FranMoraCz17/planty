import { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PlantsCatalogService, {
  type PlantCatalogItem,
} from "@/src/services/plantsCatalogService";
import SpeciesInfoService, {
  type SpeciesInfo,
} from "@/src/services/speciesInfoService";
import PhotoDetailSheet from "@/src/components/ui/PhotoDetailSheet";
import GlassChip from "@/src/components/ui/GlassChip";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

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
        (p) => p.scientificName.toLowerCase() === scientificName.toLowerCase(),
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

  const photoUri = info?.photoUri ?? info?.thumbnailUri ?? null;

  const handleAddToCollection = () => {
    const base: Record<string, string> = {
      mode: "create",
      prefillCommon: commonName,
      prefillSci: scientificName,
    };
    // Pasamos la foto de Wikipedia para que la planta nazca con imagen.
    if (photoUri) base.prefillPhoto = photoUri;
    const q = new URLSearchParams(base).toString();
    router.push(`/(app)/forms/plant?${q}`);
  };

  return (
    <PhotoDetailSheet
      photoUri={photoUri}
      placeholderIcon="leaf"
      closeIcon="chevron-left"
      onClose={() => router.back()}
    >
      {datasetMatch ? (
        <Text style={styles.overline}>
          {PlantsCatalogService.getCategoryLabel(datasetMatch.category).toUpperCase()}
        </Text>
      ) : null}
      <Text style={styles.commonName}>{commonName}</Text>
      {scientificName ? (
        <Text style={styles.scientificName}>{scientificName}</Text>
      ) : null}

      {datasetMatch ? (
        <View style={styles.chipsRow}>
          <GlassChip icon="tree-outline" value={datasetMatch.family} />
        </View>
      ) : null}

      {/* CTA principal */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar a mi coleccion"
        onPress={handleAddToCollection}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <MaterialCommunityIcons
          name="bookmark-plus-outline"
          size={18}
          color={colors.onPrimary}
        />
        <Text style={styles.ctaText}>Agregar a mi coleccion</Text>
      </Pressable>

      {/* Descripcion Wikipedia */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.sectionSource}>Wikipedia</Text>
        </View>
        {isLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : info?.extract ? (
          <Text style={styles.body}>{info.extract}</Text>
        ) : (
          <Text style={styles.noInfo}>
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
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
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
    </PhotoDetailSheet>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overline: {
      ...Typography.overline,
      color: colors.primary,
      marginBottom: 2,
    },
    commonName: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: -0.5,
      lineHeight: 36,
    },
    scientificName: {
      color: colors.textSecondary,
      fontFamily: Typography.serif,
      fontSize: 15,
      fontStyle: "italic",
    },
    chipsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      flexWrap: "wrap",
    },
    cta: {
      marginTop: Spacing.md,
      height: 52,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    ctaText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 16,
      fontWeight: "700",
    },
    section: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "700",
    },
    sectionSource: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },
    body: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: 22,
    },
    noInfo: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontStyle: "italic",
      lineHeight: 21,
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
      backgroundColor: isDark ? "rgba(111,191,149,0.16)" : "rgba(47,107,79,0.12)",
    },
    tagText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
  });
