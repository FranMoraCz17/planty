import { useCallback } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import GlassSheetBackground from "@/src/components/ui/GlassSheetBackground";
import { PlantThumb } from "./PlantThumb";
import type { AreaDocument, AreaType } from "@/src/services/areaService";
import type { PlantDocument } from "@/src/services/plantService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const TYPE_ICON: Record<AreaType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  casa: "home",
  patio: "tree-outline",
  finca: "barn",
  invernadero: "greenhouse",
  balcon: "balcony",
  vivero: "sprout",
  huerto: "carrot",
  otro: "dots-horizontal-circle-outline",
};

interface AreaDetailSheetProps {
  visible: boolean;
  // null = grupo "sin área asignada"
  area: AreaDocument | null;
  plants: PlantDocument[];
  onClose: () => void;
  onViewPlant: (plant: PlantDocument) => void;
  onDeletePlant: (plant: PlantDocument) => void;
  onEditArea?: () => void;
}

export default function AreaDetailSheet({
  visible,
  area,
  plants,
  onClose,
  onViewPlant,
  onDeletePlant,
  onEditArea,
}: AreaDetailSheetProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <BottomSheet
          index={0}
          snapPoints={["68%", "94%"]}
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={renderBackdrop}
          backgroundComponent={(props) => (
            <GlassSheetBackground {...props} isDark={isDark} />
          )}
          handleIndicatorStyle={styles.handle}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.photoWrap}>
                {area?.photoUri ? (
                  <Image source={{ uri: area.photoUri }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <MaterialCommunityIcons
                      name={area ? (TYPE_ICON[area.type] ?? "home") : "help-circle-outline"}
                      size={28}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={1}>
                  {area?.name ?? "Sin área asignada"}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {plants.length} {plants.length === 1 ? "planta" : "plantas"}
                  {area ? ` · ${area.indoor ? "Interior" : "Exterior"}` : ""}
                </Text>
              </View>
            </View>

            {plants.length === 0 ? (
              <Text style={styles.emptyText}>Sin plantas asignadas todavía.</Text>
            ) : (
              <View style={styles.plantGrid}>
                {plants.map((plant) => (
                  <PlantThumb
                    key={plant.id}
                    plant={plant}
                    onPress={() => onViewPlant(plant)}
                    onDelete={() => onDeletePlant(plant)}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}

            {area && onEditArea ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar área"
                onPress={onEditArea}
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.primary} />
                <Text style={styles.editBtnText}>Editar área</Text>
              </Pressable>
            ) : null}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    handle: {
      backgroundColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
      width: 40,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    photoWrap: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.primary,
    },
    photo: { width: "100%", height: "100%" },
    photoPlaceholder: { alignItems: "center", justifyContent: "center" },
    headerText: { flex: 1, gap: 2 },
    name: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.4,
    },
    meta: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
    },
    plantGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontStyle: "italic",
      textAlign: "center",
      paddingVertical: Spacing.lg,
    },
    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: Spacing.sm + 1,
      borderRadius: BorderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primary,
    },
    editBtnText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "700",
    },
  });
