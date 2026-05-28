import { useCallback, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

LocaleConfig.locales["es"] = {
  monthNames: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  monthNamesShort: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  dayNames: ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"],
  dayNamesShort: ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

interface WateringTask {
  plantId: string;
  plantName: string;
  scientificName: string;
  date: string;
  cycleDays: number;
  type: "watering" | "diagnose";
}

const ISO_TODAY = new Date().toISOString().slice(0, 10);
const RANGE_MONTHS_AHEAD = 3;

function parseFrequencyDays(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) && days > 0 ? days : null;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoToFriendly(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
}

function WateringButton({ onToggle, done, type }: { onToggle: () => void; done: boolean; type: "watering" | "diagnose" }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropY = useRef(new Animated.Value(0)).current;

  const pendingLabel = type === "watering" ? "Regar" : "Hacer";
  const doneLabel = "Hecha";
  const pendingIcon: IconName = type === "watering" ? "water-outline" : "stethoscope";

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.back(3)) }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
    // Gota solo al marcar riegos (no al desmarcar, no en diagnóstico)
    if (!done && type === "watering") {
      dropOpacity.setValue(1);
      dropY.setValue(0);
      Animated.parallel([
        Animated.timing(dropY, { toValue: 18, duration: 400, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.timing(dropOpacity, { toValue: 0, duration: 400, delay: 150, useNativeDriver: true }),
      ]).start();
    }
    onToggle();
  }, [done, type, scale, dropOpacity, dropY, onToggle]);

  return (
    <View style={{ position: "relative" }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={done ? "Deshacer" : "Marcar como hecha"}
          onPress={handlePress}
          style={[
            waterBtnStyles.btn,
            {
              backgroundColor: done
                ? (type === "watering" ? colors.accentCool : colors.accentWarm)
                : "transparent",
              borderColor: done
                ? (type === "watering" ? colors.accentCool : colors.accentWarm)
                : (type === "watering" ? colors.accentCool : colors.accentWarm),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={done ? "check" : pendingIcon}
            size={16}
            color={done ? "#fff" : (type === "watering" ? colors.accentCool : colors.accentWarm)}
          />
          <Text style={[waterBtnStyles.label, { color: done ? "#fff" : (type === "watering" ? colors.accentCool : colors.accentWarm) }]}>
            {done ? doneLabel : pendingLabel}
          </Text>
        </Pressable>
      </Animated.View>
      {/* Gota animada */}
      <Animated.View
        pointerEvents="none"
        style={[
          waterBtnStyles.drop,
          { opacity: dropOpacity, transform: [{ translateY: dropY }] },
        ]}
      >
        <MaterialCommunityIcons name="water" size={14} color={colors.accentCool} />
      </Animated.View>
    </View>
  );
}

const waterBtnStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  label: {
    fontFamily: Typography.family,
    fontSize: 12,
    fontWeight: "700",
  },
  drop: {
    position: "absolute",
    bottom: -8,
    left: "50%",
  },
});

export default function CalendarScreen() {
  const { colors, isDark } = useAppTheme();
  const { plants } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [selectedDate, setSelectedDate] = useState<string>(ISO_TODAY);
  // Set de tareas marcadas como completadas en esta sesión
  const [done, setDone] = useState<Set<string>>(new Set());

  const allTasks = useMemo<WateringTask[]>(() => {
    const tasks: WateringTask[] = [];
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + RANGE_MONTHS_AHEAD);
    const horizonIso = horizon.toISOString().slice(0, 10);

    plants.forEach((plant) => {
      const cycle = parseFrequencyDays(plant.wateringFrequencyLabel);
      if (!cycle) return;
      let current = ISO_TODAY;
      while (current <= horizonIso) {
        tasks.push({ plantId: plant.id, plantName: plant.name, scientificName: plant.scientificName, date: current, cycleDays: cycle, type: "watering" });
        current = addDays(current, cycle);
      }
      // Tarea de diagnóstico: cada 30 días si no tiene análisis reciente
      if (!plant.aiAnalyzed) {
        tasks.push({ plantId: plant.id, plantName: plant.name, scientificName: plant.scientificName, date: ISO_TODAY, cycleDays: 30, type: "diagnose" });
      }
    });

    return tasks;
  }, [plants]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; dots?: { color: string }[]; selected?: boolean; selectedColor?: string }> = {};
    // Acumular qué tipos de tarea tiene cada día (sin repetir dots por tarea)
    const dayTypes: Record<string, Set<"watering" | "diagnose">> = {};

    allTasks.forEach((task) => {
      if (!dayTypes[task.date]) dayTypes[task.date] = new Set();
      dayTypes[task.date].add(task.type);
    });

    Object.entries(dayTypes).forEach(([date, types]) => {
      const dots: { color: string }[] = [];
      if (types.has("watering")) dots.push({ color: colors.accentCool });
      if (types.has("diagnose")) dots.push({ color: colors.accentWarm });
      marks[date] = { marked: true, dots };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    };

    return marks;
  }, [allTasks, selectedDate, colors]);

  const tasksForDay = useMemo(
    () => allTasks.filter((t) => t.date === selectedDate),
    [allTasks, selectedDate],
  );

  const wateringCount = tasksForDay.filter((t) => t.type === "watering").length;
  const diagnoseCount = tasksForDay.filter((t) => t.type === "diagnose").length;
  const doneCount = tasksForDay.filter((t) => done.has(`${t.plantId}-${t.date}-${t.type}`)).length;

  const markDone = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Calendario" subtitle="Riegos y tareas" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.calendarCard}>
          <Calendar
            current={ISO_TODAY}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            firstDay={1}
            enableSwipeMonths
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onPrimary,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.disabled,
              dotColor: colors.primary,
              selectedDotColor: colors.onPrimary,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textMonthFontWeight: "700",
              textDayFontWeight: "500",
              textDayHeaderFontWeight: "600",
              textMonthFontSize: 18,
              textDayFontSize: 14,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Encabezado del día */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderTitle} numberOfLines={1}>
            {isoToFriendly(selectedDate)}
          </Text>
          {tasksForDay.length > 0 && (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                {doneCount}/{tasksForDay.length}
              </Text>
            </View>
          )}
        </View>

        {/* Leyenda de puntos */}
        {tasksForDay.length > 0 && (
          <View style={styles.legendRow}>
            {wateringCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accentCool }]} />
                <Text style={styles.legendText}>{wateringCount} riego{wateringCount > 1 ? "s" : ""}</Text>
              </View>
            )}
            {diagnoseCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accentWarm }]} />
                <Text style={styles.legendText}>{diagnoseCount} diagnóstico{diagnoseCount > 1 ? "s" : ""} sugerido{diagnoseCount > 1 ? "s" : ""}</Text>
              </View>
            )}
          </View>
        )}

        {tasksForDay.length === 0 ? (
          <View style={styles.emptyDay}>
            <MaterialCommunityIcons name="calendar-check-outline" size={36} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Sin tareas para este día.</Text>
            <Text style={styles.emptySubtext}>Disfruta el descanso 🌿</Text>
          </View>
        ) : (
          tasksForDay.map((task) => {
            const key = `${task.plantId}-${task.date}-${task.type}`;
            const isDone = done.has(key);
            const isWatering = task.type === "watering";
            return (
              <View key={key} style={[
                styles.taskCard,
                isDone && { opacity: 0.6, borderColor: (isWatering ? colors.accentCool : colors.accentWarm) + "44" },
              ]}>
                <View style={[
                  styles.taskIcon,
                  { backgroundColor: isWatering ? colors.accentCool + "33" : colors.accentWarm + "33" },
                ]}>
                  <MaterialCommunityIcons
                    name={isWatering ? "water" : "stethoscope"}
                    size={20}
                    color={isWatering ? colors.accentCool : colors.accentWarm}
                  />
                </View>
                <View style={styles.taskBody}>
                  <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>
                    {isWatering ? `Regar ${task.plantName}` : `Diagnosticar ${task.plantName}`}
                  </Text>
                  <Text style={styles.taskSubtitle} numberOfLines={1}>
                    {task.scientificName
                      ? task.scientificName
                      : isWatering
                        ? `Cada ${task.cycleDays} días`
                        : "Sin análisis de IA aún"}
                  </Text>
                  {isWatering && (
                    <Text style={styles.taskCycle}>Ciclo: cada {task.cycleDays} días</Text>
                  )}
                </View>
                <WateringButton
                  done={isDone}
                  onToggle={() => markDone(key)}
                  type={task.type}
                />
              </View>
            );
          })
        )}

        {/* Resumen del mes */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Este mes</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="water-outline" size={18} color={colors.accentCool} />
              <Text style={styles.summaryValue}>
                {allTasks.filter((t) => t.type === "watering" && t.date.startsWith(ISO_TODAY.slice(0, 7))).length}
              </Text>
              <Text style={styles.summaryLabel}>riegos</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="leaf" size={18} color={colors.primary} />
              <Text style={styles.summaryValue}>{plants.length}</Text>
              <Text style={styles.summaryLabel}>plantas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.summaryValue}>{done.size}</Text>
              <Text style={styles.summaryLabel}>completadas</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
    calendarCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      overflow: "hidden",
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: Spacing.sm,
    },
    dayHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
      textTransform: "capitalize",
      flex: 1,
    },
    dayBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    dayBadgeText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "800",
    },
    legendRow: {
      flexDirection: "row",
      gap: Spacing.md,
      marginTop: -Spacing.xs,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "600",
    },
    emptyDay: {
      alignItems: "center",
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    emptySubtext: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
    },
    taskCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    taskIcon: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    taskBody: { flex: 1, gap: 2 },
    taskTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    taskTitleDone: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    taskSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
      fontStyle: "italic",
    },
    taskCycle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
      marginTop: 2,
    },
    summaryCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    summaryTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
      gap: 3,
    },
    summaryDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
    summaryValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 20,
      fontWeight: "800",
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },
  });
