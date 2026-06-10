import { ScrollView, StyleSheet, Pressable, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export interface DayMarks {
  // Punto primario (ej: tareas/recomendados).
  primary?: boolean;
  // Punto secundario (ej: registros hechos).
  secondary?: boolean;
}

interface DayStripProps {
  days: string[]; // fechas ISO (YYYY-MM-DD)
  selected: string;
  todayIso: string;
  onSelect: (iso: string) => void;
  markFor?: (iso: string) => DayMarks;
}

/**
 * Tira horizontal de días deslizable. Reutilizable para calendario y clínica.
 * Cada día muestra el día de la semana, el número y hasta dos puntos de actividad.
 */
export default function DayStrip({
  days,
  selected,
  todayIso,
  onSelect,
  markFor,
}: DayStripProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.wrap,
        { borderBottomColor: colors.border },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {days.map((iso) => (
          <DayChip
            key={iso}
            iso={iso}
            selected={iso === selected}
            isToday={iso === todayIso}
            marks={markFor?.(iso) ?? {}}
            onPress={() => onSelect(iso)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function DayChip({
  iso,
  selected,
  isToday,
  marks,
  onPress,
  colors,
  isDark,
}: {
  iso: string;
  selected: boolean;
  isToday: boolean;
  marks: DayMarks;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const d = new Date(iso + "T00:00:00");
  const weekday = d
    .toLocaleDateString("es-CR", { weekday: "short" })
    .replace(".", "");
  const dayNum = d.getDate();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.primary
            : isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.6)",
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.weekday,
          { color: selected ? colors.onPrimary : colors.textSecondary },
        ]}
      >
        {weekday}
      </Text>
      <Text
        style={[styles.dayNum, { color: selected ? colors.onPrimary : colors.text }]}
      >
        {dayNum}
      </Text>
      {isToday ? (
        <View
          style={[
            styles.todayDot,
            { backgroundColor: selected ? colors.onPrimary : colors.primary },
          ]}
        />
      ) : (
        <View style={styles.dotsRow}>
          {marks.primary ? (
            <View
              style={[
                styles.dot,
                { backgroundColor: selected ? colors.onPrimary : colors.accentCool },
              ]}
            />
          ) : null}
          {marks.secondary ? (
            <View
              style={[
                styles.dot,
                { backgroundColor: selected ? colors.onPrimary : colors.accentWarm },
              ]}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  strip: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  chip: {
    width: 52,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 3,
  },
  weekday: {
    fontFamily: Typography.family,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  dayNum: {
    fontFamily: Typography.serif,
    fontSize: 20,
    fontWeight: "700",
  },
  todayDot: { width: 5, height: 5, borderRadius: 2.5 },
  dotsRow: { flexDirection: "row", gap: 3, height: 5, alignItems: "center" },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
