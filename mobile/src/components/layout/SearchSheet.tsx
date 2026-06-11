import { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
} from "react-native";
import PlantsCatalogService, {
  type PlantCatalogItem,
} from "@/src/services/plantsCatalogService";
import PlantPhotoService from "@/src/services/plantPhotoService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import SearchFilterPills from "@/src/components/search/SearchFilterPills";

interface SearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (item: PlantCatalogItem) => void;
}

export default function SearchSheet({
  visible,
  onClose,
  onSelect,
}: SearchSheetProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setActiveFilter("all");
    }
  }, [visible]);

  const results = useMemo(
    () => PlantsCatalogService.search(query, 40),
    [query],
  );

  const handleSelect = (item: PlantCatalogItem) => {
    onSelect?.(item);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={30}
                color={colors.text}
              />
            </Pressable>
            <View style={styles.searchInputWrap}>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={colors.textSecondary}
              />
              <TextInput
                accessibilityLabel="Buscar planta"
                placeholder="Buscar especie o síntoma..."
                placeholderTextColor={colors.disabled}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  accessibilityLabel="Limpiar busqueda"
                  accessibilityRole="button"
                  onPress={() => setQuery("")}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={colors.disabled}
                  />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.pillsWrap}>
            <SearchFilterPills
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </View>

          <Text style={styles.resultsLabel}>
            {query.trim()
              ? `${results.length} resultado${results.length === 1 ? "" : "s"}`
              : "Sugerencias"}
          </Text>

          <FlatList
            data={results}
            keyExtractor={(item, idx) =>
              `${item.commonName}-${item.scientificName}-${idx}`
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="magnify-remove-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>
                  No se encontraron resultados
                </Text>
                <Text style={styles.emptyText}>
                  Intenta con otra búsqueda o usa la cámara para identificar una
                  planta.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ResultRow
                item={item}
                colors={colors}
                isDark={isDark}
                onPress={() => handleSelect(item)}
              />
            )}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ResultRow({
  item,
  colors,
  isDark,
  onPress,
}: {
  item: PlantCatalogItem;
  colors: ThemeColors;
  isDark: boolean;
  onPress: () => void;
}) {
  const styles = createStyles(colors, isDark);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void PlantPhotoService.fetchSpeciesPhoto(item.scientificName).then(
      (url) => {
        if (!cancelled) setPhoto(url);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [item.scientificName]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${item.commonName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowPhotoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.rowPhoto} />
        ) : (
          <View style={styles.rowPhotoPlaceholder}>
            <MaterialCommunityIcons
              name="flower-tulip-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowCommon} numberOfLines={1}>
          {item.commonName}
        </Text>
        <Text style={styles.rowSci} numberOfLines={1}>
          {item.scientificName} · {item.family}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.sm,
      paddingTop: Platform.OS === "android" ? Spacing.md : 0,
      paddingBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    searchInputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      height: 46,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      paddingVertical: 0,
    },
    pillsWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: Spacing.sm,
    },
    resultsLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    list: {
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.xxl,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
    },
    rowPressed: {
      backgroundColor: colors.surface,
    },
    rowPhotoWrap: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.md,
      overflow: "hidden",
    },
    rowPhoto: {
      width: "100%",
      height: "100%",
    },
    rowPhotoPlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowCommon: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "700",
    },
    rowSci: {
      color: colors.textSecondary,
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontSize: Typography.caption.fontSize + 1,
    },
  });
