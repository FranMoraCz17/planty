import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

type PlantsTab = "plantas" | "recordatorios" | "fotos";

const groups = [
  { id: "g1", title: "Interiores", count: 0 },
  { id: "g2", title: "Exteriores", count: 0 },
  { id: "g3", title: "Semilleros", count: 0 },
] as const;

export default function MyPlantsTab() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const [activeTab, setActiveTab] = useState<PlantsTab>("plantas");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Mis plantas</Text>
            <ThemedButton
              label="Agregar"
              accessibilityLabel="Agregar planta"
              onPress={() => {}}
              style={styles.addButton}
            />
          </View>
          <Text style={styles.body}>
            Estructura lista para registrar inventario, recordatorios y evidencia fotografica.
          </Text>
        </View>

        <View style={styles.segmentWrap}>
          {([
            { key: "plantas", label: "Plantas" },
            { key: "recordatorios", label: "Recordatorios" },
            { key: "fotos", label: "Fotos" },
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
            <View style={styles.groupsGrid}>
              {groups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupPlaceholderGrid}>
                    {[1, 2, 3, 4].map((box) => (
                      <View key={box} style={styles.placeholderBox} />
                    ))}
                  </View>
                  <Text style={styles.groupTitle}>
                    {group.title} ({group.count})
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="sprout-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Sin plantas registradas</Text>
              <Text style={styles.emptyBody}>
                Agrega tu primera planta para activar seguimiento automatico.
              </Text>
            </View>
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

        {activeTab === "fotos" && (
          <View style={styles.photosWrap}>
            {[1, 2, 3, 4, 5, 6].map((cell) => (
              <View key={cell} style={styles.photoCell}>
                <MaterialCommunityIcons name="image-outline" size={18} color={colors.textSecondary} />
              </View>
            ))}
            <View style={styles.photoHintCard}>
              <Text style={styles.photoHintText}>Sin historial fotografico todavia.</Text>
            </View>
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
      minWidth: 92,
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
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    groupPlaceholderGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    placeholderBox: {
      width: "47%",
      aspectRatio: 1,
      borderRadius: BorderRadius.sm,
      backgroundColor: isDark ? "#2A3D37" : "#EAF4F0",
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
      textAlign: "center",
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
    photosWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    photoCell: {
      width: "31%",
      aspectRatio: 1,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      alignItems: "center",
      justifyContent: "center",
    },
    photoHintCard: {
      width: "100%",
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      padding: Spacing.md,
    },
    photoHintText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
  });