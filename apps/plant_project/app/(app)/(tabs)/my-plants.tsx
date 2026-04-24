import React, { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

type PlantsTab = "plantas" | "recordatorios";

export default function MyPlantsTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, currentUser, deletePlant, getPlantsByUser } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [activeTab, setActiveTab] = useState<PlantsTab>("plantas");
  const plants = getPlantsByUser(currentUserId);
  const totalLocations = new Set(plants.map((plant) => plant.locationName)).size;

  const groups = useMemo(() => {
    const byLocation = new Map<string, number>();

    plants.forEach((plant) => {
      const currentCount = byLocation.get(plant.locationName) ?? 0;
      byLocation.set(plant.locationName, currentCount + 1);
    });

    return Array.from(byLocation.entries()).map(([title, count], index) => ({
      id: `g-${index}`,
      title,
      count,
    }));
  }, [plants]);

  const handleDeletePlant = (plantId: string, plantName: string) => {
    Alert.alert(
      "Eliminar planta",
      `Se eliminara ${plantName} de tu coleccion.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deletePlant(plantId).catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : "No se pudo eliminar la planta.";
              Alert.alert("Error", message);
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Mis plantas</Text>
            <ThemedButton
              label="Agregar planta"
              accessibilityLabel="Crear una planta nueva"
              onPress={() => router.push("/(app)/forms/plant?mode=create")}
              style={styles.addButton}
            />
          </View>
          <Text style={styles.body}>
            Organiza el inventario real asociado a tu cuenta y mantenlo actualizado.
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{plants.length}</Text>
              <Text style={styles.summaryLabel}>Plantas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalLocations}</Text>
              <Text style={styles.summaryLabel}>Ubicaciones</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{currentUser?.pendingCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Pendientes</Text>
            </View>
          </View>
        </View>

        <View style={styles.segmentWrap}>
          {([
            { key: "plantas", label: "Plantas" },
            { key: "recordatorios", label: "Recordatorios" },
          ] as const).map((tab) => (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${tab.label}`}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.segmentButton, activeTab === tab.key && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, activeTab === tab.key && styles.segmentTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "plantas" && (
          <>
            {groups.length > 0 ? (
              <View style={styles.groupsGrid}>
                {groups.map((group) => (
                  <View key={group.id} style={styles.groupCard}>
                    <View style={styles.groupIcon}>
                      <MaterialCommunityIcons
                        name="map-marker-radius-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <Text style={styles.groupCount}>{group.count} plantas</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {plants.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons
                  name="sprout-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>Sin plantas registradas</Text>
                <Text style={styles.emptyBody}>
                  Agrega tu primera planta para empezar a editar tu coleccion y mostrar datos reales.
                </Text>
                <ThemedButton
                  accessibilityLabel="Agregar primera planta"
                  label="Agregar primera planta"
                  onPress={() => router.push("/(app)/forms/plant?mode=create")}
                />
              </View>
            ) : (
              <View style={styles.listWrap}>
                {plants.map((plant) => (
                  <View key={plant.id} style={styles.plantCard}>
                    <View style={styles.plantHeader}>
                      <View style={styles.plantIconWrap}>
                        <MaterialCommunityIcons name="leaf" size={18} color={colors.onPrimary} />
                      </View>
                      <View style={styles.plantCopy}>
                        <Text style={styles.plantName}>{plant.name}</Text>
                        <Text style={styles.plantScientificName}>{plant.scientificName}</Text>
                      </View>
                      <Pressable
                        accessibilityLabel={`Editar ${plant.name}`}
                        accessibilityRole="button"
                        onPress={() => router.push(`/(app)/forms/plant?id=${plant.id}`)}
                        style={({ pressed }) => [
                          styles.editButton,
                          pressed && styles.editButtonPressed,
                        ]}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Eliminar ${plant.name}`}
                        accessibilityRole="button"
                        onPress={() => handleDeletePlant(plant.id, plant.name)}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && styles.deleteButtonPressed,
                        ]}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaChip}>Ubicacion: {plant.locationName}</Text>
                      <Text style={styles.metaChip}>Riego: {plant.wateringFrequencyLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "recordatorios" && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Sin recordatorios activos</Text>
            <Text style={styles.emptyBody}>
              Cuando agregues plantas, aqui se organizaran riegos y tareas.
            </Text>
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
    headerCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    addButton: {
      minWidth: 120,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 2,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    body: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    summaryRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    summaryCard: {
      flex: 1,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#1A2A26" : "#F3FBF7",
      paddingVertical: Spacing.md,
      alignItems: "center",
      gap: 2,
    },
    summaryValue: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 6,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    summaryLabel: {
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
    groupsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    groupCard: {
      width: "48.5%",
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
      alignItems: "center",
    },
    groupIcon: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#20352F" : "#E5F3EE",
    },
    groupTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
    groupCount: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    emptyCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      alignItems: "center",
      gap: Spacing.xs,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    emptyBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
    listWrap: {
      gap: Spacing.sm,
    },
    plantCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    plantHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    plantIconWrap: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    plantCopy: {
      flex: 1,
      gap: 2,
    },
    plantName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    plantScientificName: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    editButton: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#1D2F2A" : "#EDF8F4",
      alignItems: "center",
      justifyContent: "center",
    },
    editButtonPressed: {
      opacity: 0.8,
    },
    deleteButton: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#2C211F" : "#FFF3F1",
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButtonPressed: {
      opacity: 0.8,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
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
  });
