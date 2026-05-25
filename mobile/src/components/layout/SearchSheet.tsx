import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
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
} from "react-native";
import PlantsCatalogService, {
  type PlantCatalogCategory,
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

interface SearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (item: PlantCatalogItem) => void;
}

const CATEGORY_COLORS: Record<PlantCatalogCategory, string> = {
  domestica: "#16A34A",
  agricola: "#B45309",
  hortaliza: "#65A30D",
  aromatica: "#0E7490",
  ornamental: "#A21CAF",
  arbol: "#4D7C0F",
};

export default function SearchSheet({
  visible,
  onClose,
  onSelect,
}: SearchSheetProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const [query, setQuery] = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
      setQuery("");
    }
  }, [visible, slideAnim]);

  const results = useMemo(
    () => PlantsCatalogService.search(query, 40),
    [query],
  );

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const handleSelect = (item: PlantCatalogItem) => {
    onSelect?.(item);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.handle} />

            <View style={styles.searchInputWrap}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                accessibilityLabel="Buscar planta"
                placeholder="Cafe, monstera, maiz, romero..."
                placeholderTextColor={colors.disabled}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityLabel="Limpiar busqueda"
                  accessibilityRole="button"
                  onPress={() => setQuery("")}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color={colors.disabled}
                  />
                </Pressable>
              ) : null}
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
                    name="leaf-off"
                    size={36}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    Sin resultados. Toca la cámara para identificar con IA.
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
        </Animated.View>
      </Pressable>
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
    void PlantPhotoService.fetchSpeciesPhoto(item.scientificName).then((url) => {
      if (!cancelled) setPhoto(url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.scientificName]);

  const categoryColor = CATEGORY_COLORS[item.category];

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
          <MaterialCommunityIcons
            name="leaf"
            size={22}
            color={colors.onPrimary}
          />
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowCommon} numberOfLines={1}>
          {item.commonName}
        </Text>
        <Text style={styles.rowSci} numberOfLines={1}>
          {item.scientificName}
        </Text>
        <View style={styles.rowMeta}>
          <View
            style={[styles.categoryDot, { backgroundColor: categoryColor }]}
          />
          <Text style={styles.rowCategory}>
            {PlantsCatalogService.getCategoryLabel(item.category)}
          </Text>
          <Text style={styles.rowDot}>·</Text>
          <Text style={styles.rowFamily} numberOfLines={1}>
            {item.family}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      height: "85%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 16,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 6,
      marginBottom: Spacing.md,
    },
    searchInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      height: 50,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      paddingVertical: 0,
    },
    resultsLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    list: {
      paddingBottom: Spacing.xxl,
      gap: Spacing.xs,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      textAlign: "center",
      maxWidth: 260,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    rowPressed: {
      backgroundColor: isDark ? "#22332F" : "#EEF7F3",
    },
    rowPhotoWrap: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    rowPhoto: {
      width: "100%",
      height: "100%",
    },
    rowBody: {
      flex: 1,
      gap: 1,
    },
    rowCommon: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    rowSci: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontStyle: "italic",
      fontWeight: "500",
    },
    rowMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 1,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    rowCategory: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    rowDot: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
    },
    rowFamily: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
      flexShrink: 1,
    },
  });
