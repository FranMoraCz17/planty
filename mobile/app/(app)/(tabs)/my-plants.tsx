import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function MyPlantsTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, deletePlant, getPlantsByUser } = useDemoData();
  const styles = createStyles(colors, isDark);
  const plants = getPlantsByUser(currentUserId);

  const handleDelete = (plantId: string, plantName: string) => {
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
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar la planta.";
              Alert.alert("Error", message);
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Plantas" subtitle="Tu coleccion" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {plants.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="sprout-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Aun no hay plantas. Agrega la primera.
            </Text>
          </View>
        ) : (
          plants.map((plant) => (
            <View key={plant.id} style={styles.plantRow}>
              <View style={styles.plantIcon}>
                <MaterialCommunityIcons
                  name="leaf"
                  size={18}
                  color={colors.onPrimary}
                />
              </View>
              <View style={styles.plantBody}>
                <Text style={styles.plantName}>{plant.name}</Text>
                <Text style={styles.plantMeta}>
                  {plant.locationName} - {plant.wateringFrequencyLabel}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Editar ${plant.name}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push(`/(app)/forms/plant?id=${plant.id}`)
                }
                style={({ pressed }) => [
                  styles.rowAction,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable
                accessibilityLabel={`Eliminar ${plant.name}`}
                accessibilityRole="button"
                onPress={() => handleDelete(plant.id, plant.name)}
                style={({ pressed }) => [
                  styles.rowAction,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar planta"
        onPress={() => router.push("/(app)/forms/plant?mode=create")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
      </Pressable>
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
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: 120,
      gap: Spacing.sm,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      maxWidth: 260,
    },
    plantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    plantIcon: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    plantBody: {
      flex: 1,
      gap: 2,
    },
    plantName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    plantMeta: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },
    rowAction: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.5,
      backgroundColor: isDark ? "#22332F" : "#EAF4F0",
    },
    fab: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 100,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    fabPressed: {
      opacity: 0.85,
    },
  });
