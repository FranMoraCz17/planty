import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
import DayStrip from "@/src/components/ui/DayStrip";
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

type TaskType = "watering" | "diagnose";

interface PlantDay {
  plantId: string;
  plantName: string;
  scientificName: string;
  plantPhotoUri?: string;
  types: Set<TaskType>;
}

const ISO_TODAY = new Date().toISOString().slice(0, 10);
const DAYS_AHEAD = 14;
const RANGE_MONTHS_AHEAD = 3;

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
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { plants } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [selectedDate, setSelectedDate] = useState<string>(ISO_TODAY);
  const [history, setHistory] = useState<DiagnoseRecord[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

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

  const tasksByDate = useMemo(() => {
    const map = new Map<string, PlantDay>();
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + RANGE_MONTHS_AHEAD);
    const horizonIso = horizon.toISOString().slice(0, 10);

    const add = (date: string, plant: (typeof plants)[number], type: TaskType) => {
      const dayKey = `${date}|${plant.id}`;
      const existing = map.get(dayKey);
      if (existing) existing.types.add(type);
      else
        map.set(dayKey, {
          plantId: plant.id,
          plantName: plant.name,
          scientificName: plant.scientificName,
          plantPhotoUri: plant.photoUri,
          types: new Set([type]),
        });
    };

    plants.forEach((plant) => {
      const cycle = parseFrequencyDays(plant.wateringFrequencyLabel);
      if (cycle) {
        let current = ISO_TODAY;
        while (current <= horizonIso) {
          add(current, plant, "watering");
          current = addDays(current, cycle);
        }
      }
      if (!plant.aiAnalyzed) add(ISO_TODAY, plant, "diagnose");
    });

    return map;
  }, [plants]);

  const daysWithTasks = useMemo(() => {
    const set = new Set<string>();
    tasksByDate.forEach((_v, key) => set.add(key.split("|")[0]));
    return set;
  }, [tasksByDate]);

  const daysWithHistory = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => set.add(h.createdAt.slice(0, 10)));
    return set;
  }, [history]);

  const plantsForDay = useMemo(() => {
    const list: PlantDay[] = [];
    tasksByDate.forEach((value, key) => {
      if (key.startsWith(`${selectedDate}|`)) list.push(value);
    });
    return list;
  }, [tasksByDate, selectedDate]);

  const historyForDay = useMemo(
    () =>
      history
        .filter((h) => h.createdAt.slice(0, 10) === selectedDate)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [history, selectedDate],
  );

  const doneKey = (plantId: string) => `${selectedDate}|${plantId}`;

  const toggleDone = (plantId: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      const key = doneKey(plantId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Calendario" subtitle="Tu semana de cuidados" />

      <DayStrip
        days={days}
        selected={selectedDate}
        todayIso={ISO_TODAY}
        onSelect={setSelectedDate}
        markFor={(iso) => ({
          primary: daysWithTasks.has(iso),
          secondary: daysWithHistory.has(iso),
        })}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dayHeaderTitle} numberOfLines={1}>
          {isoToFriendly(selectedDate)}
        </Text>

        {plantsForDay.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NECESITAN ATENCIÓN</Text>
            {plantsForDay.map((item, i) => (
              <PlantDayCard
                key={item.plantId}
                item={item}
                done={done.has(doneKey(item.plantId))}
                onPress={() => setFocusIndex(i)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        ) : null}

        {historyForDay.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIAGNÓSTICOS REALIZADOS</Text>
            {historyForDay.map((record) => (
              <DiagnoseHistoryCard
                key={record.id}
                record={record}
                onPress={() => router.push(`/(app)/plant/${record.plantId}`)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        ) : null}

        {plantsForDay.length === 0 && historyForDay.length === 0 ? (
          <View style={styles.emptyDay}>
            <MaterialCommunityIcons
              name="weather-night"
              size={36}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Nada pendiente este día.</Text>
            <Text style={styles.emptySubtext}>Tus plantas están tranquilas.</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Vista de tarea inmersiva (carrusel del día) */}
      <TaskFocusModal
        items={plantsForDay}
        startIndex={focusIndex}
        visible={focusIndex !== null}
        isDoneAt={(i) => done.has(doneKey(plantsForDay[i]?.plantId ?? ""))}
        onToggleDone={(i) => {
          const item = plantsForDay[i];
          if (item) toggleDone(item.plantId);
        }}
        onClose={() => setFocusIndex(null)}
        colors={colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

// ── Card de planta (foto protagonista; toca para abrir la vista de tarea) ──
function PlantDayCard({
  item,
  done,
  onPress,
  colors,
  isDark,
}: {
  item: PlantDay;
  done: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const { photoUri } = usePlantPhoto({
    userPhotoUri: item.plantPhotoUri,
    scientificName: item.scientificName,
  });
  const needsWater = item.types.has("watering");
  const needsCheck = item.types.has("diagnose");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tarea de ${item.plantName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.plantCard,
        done && { opacity: 0.55 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Foto desenfocada de fondo → efecto liquid glass (cristal sobre foto) */}
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFill}
          blurRadius={22}
        />
      ) : null}
      <View style={styles.cardGlassTint} />

      <View style={styles.plantThumbWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.plantThumb} />
        ) : (
          <View style={[styles.plantThumb, styles.plantThumbPlaceholder]}>
            <MaterialCommunityIcons name="leaf" size={26} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <View style={styles.plantBody}>
        <Text style={styles.plantName} numberOfLines={1}>
          {item.plantName}
        </Text>
        <View style={styles.tagRow}>
          {needsWater ? (
            <View style={styles.tag}>
              <MaterialCommunityIcons
                name="water-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.tagText}>Riego</Text>
            </View>
          ) : null}
          {needsCheck ? (
            <View style={styles.tag}>
              <MaterialCommunityIcons
                name="stethoscope"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.tagText}>Revisión</Text>
            </View>
          ) : null}
        </View>
      </View>
      {done ? (
        <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

// ── Vista de tarea inmersiva: foto a sangre + barra inferior (< ✓ >) ──
function TaskFocusModal({
  items,
  startIndex,
  visible,
  isDoneAt,
  onToggleDone,
  onClose,
  colors,
  isDark,
}: {
  items: PlantDay[];
  startIndex: number | null;
  visible: boolean;
  isDoneAt: (i: number) => boolean;
  onToggleDone: (i: number) => void;
  onClose: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex, visible]);

  const item = items[index] ?? null;
  const { photoUri } = usePlantPhoto({
    userPhotoUri: item?.plantPhotoUri,
    scientificName: item?.scientificName ?? null,
  });
  const [showRain, setShowRain] = useState(false);

  useEffect(() => {
    setShowRain(false);
  }, [index]);

  if (!item) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} />
    );
  }

  const done = isDoneAt(index);
  const needsWater = item.types.has("watering");
  const hasNext = index < items.length - 1;
  const taskLabel = needsWater ? "Riego de hoy" : "Revisión de salud";
  const taskHint = needsWater
    ? "Regá esta planta y deslizá para marcarla como lista."
    : "Hacé una revisión de salud con la IA y deslizá cuando termines.";

  const goNext = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  const confirm = () => {
    onToggleDone(index);
    if (needsWater && !done) {
      setShowRain(true);
      setTimeout(() => {
        setShowRain(false);
        if (hasNext) goNext();
        else onClose();
      }, 1600);
    } else {
      setTimeout(() => {
        if (hasNext) goNext();
        else onClose();
      }, 280);
    }
  };

  const topPad = Math.max(insets.top, 52);
  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={focusStyles.root}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={focusStyles.bg} />
        ) : (
          <View style={[focusStyles.bg, { backgroundColor: colors.primary }]} />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Lluvia cayendo sobre la planta — solo al regarla */}
        {showRain ? <RainOverlay /> : null}

        {/* Cerrar + contador */}
        <View style={[focusStyles.topBar, { paddingTop: topPad }]}>
          <Pressable onPress={onClose} hitSlop={10} style={focusStyles.glassBtn}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={focusStyles.glassTint} />
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={focusStyles.counter}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={focusStyles.glassTint} />
            <Text style={focusStyles.counterText}>
              {index + 1} / {items.length}
            </Text>
          </View>
        </View>

        {/* Info editorial */}
        <View style={[focusStyles.info, { paddingBottom: bottomPad + 96 }]} pointerEvents="none">
          <Text style={focusStyles.overline}>{taskLabel.toUpperCase()}</Text>
          <Text style={focusStyles.name}>{item.plantName}</Text>
          {item.scientificName ? (
            <Text style={focusStyles.sci}>{item.scientificName}</Text>
          ) : null}
          <Text style={focusStyles.hint}>{taskHint}</Text>
        </View>

        {/* Slide para marcar como hecha (estilo alarma de iPhone) + siguiente tarea */}
        <View style={[focusStyles.bar, { paddingBottom: bottomPad }]}>
          <View style={focusStyles.slideWrap}>
            <SlideToConfirm
              done={done}
              onConfirm={confirm}
              onUndo={() => onToggleDone(index)}
              colors={colors}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tarea siguiente"
            disabled={!hasNext}
            onPress={goNext}
            style={({ pressed }) => [
              focusStyles.nextBtn,
              { opacity: !hasNext ? 0.3 : pressed ? 0.7 : 1 },
            ]}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={focusStyles.glassTint} />
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Slide-to-confirm tipo "deslizar para apagar alarma" de iOS ──
const SLIDE_THUMB_SIZE = 52;
const SLIDE_TRACK_PADDING = 4;

function SlideToConfirm({
  done,
  onConfirm,
  onUndo,
  colors,
}: {
  done: boolean;
  onConfirm: () => void;
  onUndo: () => void;
  colors: ThemeColors;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const maxX = Math.max(0, trackWidth - SLIDE_THUMB_SIZE - SLIDE_TRACK_PADDING * 2);

  const maxXRef = useRef(maxX);
  maxXRef.current = maxX;
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    pan.setValue(done ? maxXRef.current : 0);
  }, [done, pan, maxX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !doneRef.current,
      onMoveShouldSetPanResponder: (_, g) => !doneRef.current && Math.abs(g.dx) > 2,
      onPanResponderMove: (_, g) => {
        const x = Math.min(Math.max(g.dx, 0), maxXRef.current);
        pan.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx >= maxXRef.current * 0.65) {
          Animated.timing(pan, { toValue: maxXRef.current, duration: 120, useNativeDriver: false }).start(() => {
            onConfirmRef.current();
          });
        } else {
          Animated.spring(pan, { toValue: 0, friction: 6, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  return (
    <View
      style={focusStyles.slideTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={focusStyles.slideTint} />
      <Animated.View
        style={[
          focusStyles.slideFill,
          { width: Animated.add(pan, SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING), backgroundColor: colors.primary },
        ]}
      />
      <Text style={focusStyles.slideLabel}>
        {done ? "¡Listo! Tocá para deshacer" : "Deslizá para marcar como hecha"}
      </Text>
      {done ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel="Deshacer, marcar como pendiente"
        />
      ) : null}
      <Animated.View
        {...(done ? {} : panResponder.panHandlers)}
        style={[
          focusStyles.slideThumb,
          { backgroundColor: done ? colors.primary : "#fff", transform: [{ translateX: pan }] },
        ]}
      >
        <MaterialCommunityIcons
          name={done ? "check" : "chevron-double-right"}
          size={22}
          color={done ? "#fff" : colors.primary}
        />
      </Animated.View>
    </View>
  );
}

// ── Lluvia cayendo desde arriba sobre la foto de la planta ──
const RAIN_DROPS = 16;

function RainOverlay() {
  const { width, height } = useWindowDimensions();
  const drops = useRef(
    Array.from({ length: RAIN_DROPS }, () => ({
      x: Math.random() * width,
      delay: Math.random() * 1800,
      duration: 1000 + Math.random() * 800,
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const loops = drops.map((d) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(d.delay),
          Animated.timing(d.anim, {
            toValue: 1,
            duration: d.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(d.anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [drops]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {drops.map((d, i) => {
        const translateY = d.anim.interpolate({ inputRange: [0, 1], outputRange: [-30, height * 0.65] });
        const opacity = d.anim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.6, 0.6, 0] });
        return (
          <Animated.View
            key={i}
            style={[
              focusStyles.raindrop,
              { left: d.x, opacity, transform: [{ translateY }] },
            ]}
          />
        );
      })}
    </View>
  );
}

const focusStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bg: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    zIndex: 3,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  counter: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  counterText: {
    color: "#fff",
    fontFamily: Typography.family,
    fontSize: 13,
    fontWeight: "700",
  },
  info: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: 0,
    gap: 4,
  },
  overline: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: Typography.family,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  name: {
    color: "#fff",
    fontFamily: Typography.serif,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  sci: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: Typography.serif,
    fontSize: 17,
    fontStyle: "italic",
  },
  hint: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: Typography.family,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  slideWrap: { width: "75%" },
  nextBtn: {
    flex: 1,
    height: SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2,
    borderRadius: (SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2) / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  slideTrack: {
    height: SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2,
    borderRadius: (SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2) / 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  slideTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: (SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  slideFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: (SLIDE_THUMB_SIZE + SLIDE_TRACK_PADDING * 2) / 2,
  },
  slideLabel: {
    textAlign: "center",
    color: "#fff",
    fontFamily: Typography.family,
    fontSize: 13,
    fontWeight: "700",
  },
  slideThumb: {
    position: "absolute",
    left: SLIDE_TRACK_PADDING,
    top: SLIDE_TRACK_PADDING,
    width: SLIDE_THUMB_SIZE,
    height: SLIDE_THUMB_SIZE,
    borderRadius: SLIDE_THUMB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  raindrop: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});

// ── Diagnóstico hecho (clasificación por estado) ──
function DiagnoseHistoryCard({
  record,
  onPress,
  colors,
  isDark,
}: {
  record: DiagnoseRecord;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const color = HEALTH_COLOR[record.healthStatus] ?? colors.textSecondary;
  const label = HEALTH_LABEL[record.healthStatus] ?? record.healthStatus;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Diagnóstico de ${record.plantName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.diagCard, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.diagStatusBar, { backgroundColor: color }]} />
      <View style={styles.plantBody}>
        <View style={styles.diagHeaderRow}>
          <Text style={styles.plantName} numberOfLines={1}>
            {record.plantName}
          </Text>
          <View style={[styles.diagBadge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.diagBadgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.plantSci} numberOfLines={2}>
          {record.healthSummary}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: 120,
      gap: Spacing.md,
    },
    dayHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.3,
      textTransform: "capitalize",
    },
    section: { gap: Spacing.md },
    sectionLabel: { ...Typography.overline, color: colors.textSecondary, marginBottom: 2 },

    emptyDay: { alignItems: "center", paddingVertical: Spacing.xxxl, gap: Spacing.sm },
    emptyText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    emptySubtext: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
    },

    plantCard: {
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
      overflow: "hidden",
    },
    cardGlassTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(16,18,13,0.60)" : "rgba(248,246,240,0.45)",
    },
    plantThumbWrap: {
      width: 60,
      height: 60,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
    },
    plantThumb: { width: "100%", height: "100%", resizeMode: "cover" },
    plantThumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    plantBody: { flex: 1, gap: 3 },
    plantName: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    plantSci: {
      color: colors.textSecondary,
      fontFamily: Typography.serif,
      fontSize: 13,
      fontStyle: "italic",
    },
    tagRow: { flexDirection: "row", gap: Spacing.xs, marginTop: 2 },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.sm,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tagText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },

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
