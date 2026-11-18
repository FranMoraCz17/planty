import { useCallback, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FavoriteFactsService, {
  type FavoriteFact,
} from "@/src/services/favoriteFactsService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [favorites, setFavorites] = useState<FavoriteFact[]>([]);

  useFocusEffect(
    useCallback(() => {
      void FavoriteFactsService.getAll().then(setFavorites);
    }, []),
  );

  const handleRemove = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    void FavoriteFactsService.remove(id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notas favoritas</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Sin notas guardadas</Text>
            <Text style={styles.emptyText}>
              Toca el corazón en el dato del día del inicio para guardarlo aquí.
            </Text>
          </View>
        ) : (
          favorites.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardSpecies}>{item.scientificName}</Text>
                <Text style={styles.cardFact}>{item.fact}</Text>
                <Text style={styles.cardDate}>Guardado el {formatDate(item.savedAt)}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar de favoritos"
                onPress={() => handleRemove(item.id)}
                hitSlop={8}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <MaterialCommunityIcons name="heart" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    backBtn: {
      width: 26,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    headerTitle: {
      ...Typography.title,
      color: colors.text,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 120,
      gap: Spacing.sm,
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    cardBody: { flex: 1, gap: 4 },
    cardSpecies: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    cardFact: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight + 2,
    },
    cardDate: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: Spacing.xxl * 2,
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize,
      fontWeight: "700",
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      lineHeight: 22,
    },
  });
