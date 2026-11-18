import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import type { PlantDocument } from "@/src/services/plantService";
import { BorderRadius, Typography, type ThemeColors } from "@/src/theme/designSystem";

interface PlantThumbProps {
  plant: PlantDocument;
  onPress: () => void;
  onDelete: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

export function PlantThumb({ plant, onPress, onDelete, colors, isDark }: PlantThumbProps) {
  const { photoUri: catalogPhoto } = usePlantPhoto({ scientificName: plant.scientificName });
  const photo = plant.photoUri ?? catalogPhoto;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${plant.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.82 }]}
    >
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View
            style={[
              styles.photo,
              {
                backgroundColor: isDark ? "#143018" : "#DCFCE7",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <MaterialCommunityIcons name="leaf" size={22} color={colors.primary} />
          </View>
        )}
        {plant.aiAnalyzed && (
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="creation" size={8} color="#fff" />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${plant.name}`}
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="close" size={10} color="#fff" />
        </Pressable>
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {plant.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "31%", gap: 4 },
  photoWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  aiBadge: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: Typography.family,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
