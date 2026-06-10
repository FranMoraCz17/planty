import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import {
  getDiagnosesByPlant,
  type DiagnoseRecord,
} from "@/src/services/diagnoseHistoryService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type TaskType = "watering" | "diagnose";

interface WateringTask {
  plantId: string;
  plantName: string;
  scientificName: string;
  plantPhotoUri?: string;
  date: string;
  cycleDays: number;
  type: TaskType;
}

const ISO_TODAY = new Date().toISOString().slice(0, 10);
const DAYS_AHEAD = 21;
const RANGE_MONTHS_AHEAD = 3;

// Clasificación por estado de salud (clínica).
const HEALTH_COLOR: Record<string, string> = {
  saludable: "#3E8E6A",
  atencion: "#B07C3A",
  enferma: "#A63A2E",
  critica: "#7F1D1D",
};
const HEALTH_LABEL: Record<string, string> = {
  saludable: "Saludable",
  atencion: "Atención",
  enferma: "Enferma",
  critica: "Crítica",
};

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
  return d.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function CalendarScreen() {
  const { colors, isDark } = useAppTheme();
  const { plants } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [selectedDate, setSelectedDate] = useState<string>(ISO_TODAY);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<DiagnoseRecord[]>([]);

  // Cargar diagnósticos ya hechos (clínica) para mostrarlos en su día.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all: DiagnoseRecord[] = [];
      for (const plant of plants) {
        const recs = await getDiagnosesByPlant(plant.id).catch(() => []);
        all.push(...recs);
      }
      if (!cancelled) setHistory(all);
    })();
    return () => {
      cancelled = true;
    };
  }, [plants]);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < DAYS_AHEAD; i += 1) arr.push(addDays(ISO_TODAY, i));
    return arr;
  }, []);

  const allTasks = useMemo<WateringTask[]>(() => {
    const tasks: WateringTask[] = [];
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + RANGE_MONTHS_AHEAD);
    const horizonIso = horizon.toISOString().slice(0, 10);

    plants.forEach((plant) => {
      const cycle = parseFrequencyDays(plant.wateringFrequencyLabel);
      if (cycle) {
        let current = ISO_TODAY;
        while (current <= horizonIso) {
          tasks.push({
            plantId: plant.id,
            plantName: plant.name,
            scientificName: plant.scientificName,
            plantPhotoUri: plant.photoUri,
            date: current,
            cycleDays: cycle,
            type: "watering",
          });
          current = addDays(current, cycle);
        }
      }
      if (!plant.aiAnalyzed) {
        tasks.push({
          plantId: plant.id,
          plantName: plant.name,
          scientificName: plant.scientificName,
          plantPhotoUri: plant.photoUri,
          date: ISO_TODAY,
          cycleDays: 30,
          type: "diagnose",
        });
      }
    });

    return tasks;
  }, [plants]);

  // Qué días tienen actividad (para los puntos de la tira).
  const daysWithTasks = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach((t) => set.add(t.date));
    return set;
  }, [allTasks]);

  const daysWithHistory = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => set.add(h.createdAt.slice(0, 10)));
    return set;
  }, [history]);

  const tasksForDay = useMemo(
    () => allTasks.filter((t) => t.date === selectedDate),
    [allTasks, selectedDate],
  );

  const historyForDay = useMemo(
    () =>
      history
        .filter((h) => h.createdAt.slice(0, 10) === selectedDate)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [history, selectedDate],
  );

  const doneCount = tasksForDay.filter((t) =>
    done.has(`${t.plantId}-${t.date}-${t.type}`),
  ).length;

  const markDone = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Calendario" subtitle="Tu semana de cuidados" />

      {/* Tira de días deslizable */}
      <View style={styles.stripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {days.map((iso) => (
            <DayChip
              key={iso}
              iso={iso}
              selected={iso === selectedDate}
              hasTasks={daysWithTasks.has(iso)}
              hasHistory={daysWithHistory.has(iso)}
              onPress={() => setSelectedDate(iso)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado del día */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderTitle} numberOfLines={1}>
            {isoToFriendly(selectedDate)}
          </Text>
          {tasksForDay.length > 0 ? (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                {doneCount}/{tasksForDay.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Tareas pendientes del día */}
        {tasksForDay.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAREAS</Text>
            {tasksForDay.map((task) => {
              const key = `${task.plantId}-${task.date}-${task.type}`;
              return (
                <TaskCard
                  key={key}
                  task={task}
                  done={done.has(key)}
                  onToggle={() => markDone(key)}
                  colors={colors}
                  isDark={isDark}
                />
              );
            })}
          </View>
        ) : null}

        {/* Diagnósticos hechos ese día (clínica) */}
        {historyForDay.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIAGNÓSTICOS REALIZADOS</Text>
            {historyForDay.map((record) => (
              <DiagnoseHistoryCard
                key={record.id}
                record={record}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        ) : null}

        {tasksForDay.length === 0 && historyForDay.length === 0 ? (
          <View style={styles.emptyDay}>
            <MaterialCommunityIcons
              name="calendar-check-outline"
              size={36}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Sin actividad este día.</Text>
            <Text style={styles.emptySubtext}>Disfruta el descanso.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Chip de día en la tira ──
function DayChip({
  iso,
  selected,
  hasTasks,
  hasHistory,
  onPress,
  colors,
  isDark,
}: {
  iso: string;
  selected: boolean;
  hasTasks: boolean;
  hasHistory: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const d = new Date(iso + "T00:00:00");
  const weekday = d.toLocaleDateString("es-CR", { weekday: "short" }).replace(".", "");
  const dayNum = d.getDate();
  const isToday = iso === ISO_TODAY;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isoToFriendly(iso)}
      onPress={onPress}
      style={[
        chipStyles.chip,
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
          chipStyles.weekday,
          { color: selected ? colors.onPrimary : colors.textSecondary },
        ]}
      >
        {weekday}
      </Text>
      <Text
        style={[
          chipStyles.dayNum,
          { color: selected ? colors.onPrimary : colors.text },
        ]}
      >
        {dayNum}
      </Text>
      {isToday ? (
        <View
          style={[
            chipStyles.todayDot,
            { backgroundColor: selected ? colors.onPrimary : colors.primary },
          ]}
        />
      ) : (
        <View style={chipStyles.dotsRow}>
          {hasTasks ? (
            <View
              style={[
                chipStyles.dot,
                { backgroundColor: selected ? colors.onPrimary : colors.accentCool },
              ]}
            />
          ) : null}
          {hasHistory ? (
            <View
              style={[
                chipStyles.dot,
                { backgroundColor: selected ? colors.onPrimary : colors.accentWarm },
              ]}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
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

// ── Tarea con foto de la planta ──
function TaskCard({
  task,
  done,
  onToggle,
  colors,
  isDark,
}: {
  task: WateringTask;
  done: boolean;
  onToggle: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const { photoUri } = usePlantPhoto({
    userPhotoUri: task.plantPhotoUri,
    scientificName: task.scientificName,
  });
  const isWatering = task.type === "watering";

  return (
    <View style={[styles.taskCard, done && { opacity: 0.55 }]}>
      <View style={styles.taskThumbWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.taskThumb} />
        ) : (
          <View style={[styles.taskThumb, styles.taskThumbPlaceholder]}>
            <MaterialCommunityIcons name="leaf" size={20} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]} numberOfLines={1}>
          {isWatering ? `Regar ${task.plantName}` : `Diagnosticar ${task.plantName}`}
        </Text>
        <Text style={styles.taskSubtitle} numberOfLines={1}>
          {isWatering ? `Cada ${task.cycleDays} días` : "Sin análisis de IA aún"}
        </Text>
      </View>
      <WateringButton done={done} onToggle={onToggle} type={task.type} />
    </View>
  );
}

// ── Diagnóstico hecho (clínica) ──
function DiagnoseHistoryCard({
  record,
  colors,
  isDark,
}: {
  record: DiagnoseRecord;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const color = HEALTH_COLOR[record.healthStatus] ?? colors.textSecondary;
  const label = HEALTH_LABEL[record.healthStatus] ?? record.healthStatus;

  return (
    <View style={styles.diagCard}>
      <View style={[styles.diagStatusBar, { backgroundColor: color }]} />
      <View style={styles.taskBody}>
        <View style={styles.diagHeaderRow}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {record.plantName}
          </Text>
          <View style={[styles.diagBadge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.diagBadgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.taskSubtitle} numberOfLines={2}>
          {record.healthSummary}
        </Text>
      </View>
    </View>
  );
}

// ── Botón de marcar tarea (con animación de gota) ──
function WateringButton({
  onToggle,
  done,
  type,
}: {
  onToggle: () => void;
  done: boolean;
  type: TaskType;
}) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const dropY = useRef(new Animated.Value(0)).current;

  const tone = colors.primary;
  const pendingLabel = type === "watering" ? "Regar" : "Revisar";
  const pendingIcon: IconName = type === "watering" ? "water-outline" : "stethoscope";

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true, easing: Easing.out(Easing.back(3)) }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
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
            done
              ? { backgroundColor: tone, borderColor: tone }
              : { backgroundColor: "transparent", borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons
            name={done ? "check" : pendingIcon}
            size={15}
            color={done ? colors.onPrimary : tone}
          />
          <Text style={[waterBtnStyles.label, { color: done ? colors.onPrimary : tone }]}>
            {done ? "Hecha" : pendingLabel}
          </Text>
        </Pressable>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[waterBtnStyles.drop, { opacity: dropOpacity, transform: [{ translateY: dropY }] }]}
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { fontFamily: Typography.family, fontSize: 12, fontWeight: "700" },
  drop: { position: "absolute", bottom: -8, left: "50%" },
});

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    stripWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: Spacing.sm,
    },
    strip: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.xs,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: 120,
      gap: Spacing.md,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dayHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.3,
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
    section: { gap: Spacing.md },
    sectionLabel: { ...Typography.overline, color: colors.textSecondary, marginBottom: 2 },

    emptyDay: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.sm },
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

    // Tarea
    taskCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
      padding: Spacing.md,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    taskThumbWrap: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      overflow: "hidden",
    },
    taskThumb: { width: "100%", height: "100%", resizeMode: "cover" },
    taskThumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
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
    },

    // Diagnóstico hecho
    diagCard: {
      flexDirection: "row",
      gap: Spacing.md,
      backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
      padding: Spacing.md,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    diagStatusBar: { width: 4, borderRadius: 2, alignSelf: "stretch" },
    diagHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    diagBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    diagBadgeText: {
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "800",
    },
  });
