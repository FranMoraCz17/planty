import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line as SvgLine, Polyline } from "react-native-svg";
import { useDemoData } from "@/src/data/DemoDataProvider";
import DayStrip from "@/src/components/ui/DayStrip";
import FullscreenImageViewer from "@/src/components/ui/FullscreenImageViewer";
import DiagnoseService from "@/src/services/diagnoseService";
import {
  getDiagnosesByPlant,
  saveDiagnose,
  type DiagnoseRecord,
} from "@/src/services/diagnoseHistoryService";
import type { DiagnoseHealthStatus, DiagnoseIssueCategory } from "@/src/services/diagnoseService";
import type { PlantDocument } from "@/src/services/plantService";
import {
  BorderRadius,
  getClinicColors,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

// ─── Fitopatología: constantes científicas ────────────────────────────────────

const HEALTH_LABEL: Record<DiagnoseHealthStatus, string> = {
  saludable: "Saludable",
  atencion:  "Atención",
  enferma:   "Enferma",
  critica:   "Crítica",
};
// Días entre diagnósticos según severidad del último resultado (protocolo fitopatológico)
const RECHECK_DAYS: Record<DiagnoseHealthStatus, number> = {
  saludable: 30,
  atencion:  14,
  enferma:   7,
  critica:   3,
};
// Score equivalente por estado de salud, usado para el índice fitosanitario y la tendencia.
const HEALTH_WEIGHT: Record<DiagnoseHealthStatus, number> = {
  saludable: 100,
  atencion:  60,
  enferma:   25,
  critica:   0,
};
const CATEGORY_ICON: Record<DiagnoseIssueCategory, string> = {
  plaga:        "bug-outline",
  enfermedad:   "virus-outline",
  deficiencia:  "water-minus-outline",
  exceso:       "water-plus-outline",
  ambiental:    "thermometer-alert",
};

const ISO_TODAY = new Date().toISOString().slice(0, 10);
const CLINIC_DAYS_AHEAD = 14;

// Filtros de la vista "Diagnósticos": recencia global o agrupado por gravedad.
const DIAG_FILTERS: { key: DiagnoseHealthStatus | "recientes" | "sindatos"; label: string }[] = [
  { key: "recientes", label: "Recientes" },
  { key: "critica", label: "Crítica" },
  { key: "enferma", label: "Enferma" },
  { key: "atencion", label: "Atención" },
  { key: "saludable", label: "Saludable" },
  { key: "sindatos", label: "Sin datos" },
];

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Fecha ISO del próximo diagnóstico recomendado para una planta.
function nextDiagnoseIso(last: DiagnoseRecord | null): string {
  const base = last ? new Date(last.createdAt) : new Date();
  const interval = last ? RECHECK_DAYS[last.healthStatus] : 0;
  const next = new Date(base);
  next.setDate(next.getDate() + interval);
  return next.toISOString().slice(0, 10);
}

// Calcula días hasta el próximo diagnóstico recomendado
function nextDiagnoseDate(last: DiagnoseRecord | null): { date: string; daysLeft: number } {
  const base = last ? new Date(last.createdAt) : new Date();
  const interval = last ? RECHECK_DAYS[last.healthStatus] : 0;
  const next = new Date(base);
  next.setDate(next.getDate() + interval);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
  return {
    date: next.toLocaleDateString("es-CR", { day: "numeric", month: "short" }),
    daysLeft,
  };
}

// Score de salud 0-100 basado en historial
function healthScore(history: DiagnoseRecord[]): number {
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, r) => acc + HEALTH_WEIGHT[r.healthStatus], 0);
  return Math.round(sum / history.length);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}
function formatShortDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" }); }
  catch { return "—"; }
}

// ─── PulseBar — barra de salud animada tipo monitor ──────────────────────────

function PulseBar({ score, color }: { score: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={pulseStyles.track}>
      <Animated.View style={[pulseStyles.fill, { width: width as never, backgroundColor: color }]} />
      <View style={[pulseStyles.marker, { left: `${score}%` as never }]} />
    </View>
  );
}
const pulseStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "visible", position: "relative" },
  fill: { height: "100%", borderRadius: 4 },
  marker: { position: "absolute", top: -3, width: 2, height: 14, backgroundColor: "#fff", borderRadius: 1, opacity: 0.6 },
});

// ─── CountdownBadge ────────────────────────────────────────────────────────────

function CountdownBadge({ daysLeft, colors, isDark }: { daysLeft: number; colors: ThemeColors; isDark: boolean }) {
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const urgent = daysLeft <= 0;
  const soon = daysLeft <= 3 && daysLeft > 0;
  const tone = urgent ? clinicColors.health.critica : soon ? clinicColors.health.atencion : clinicColors.health.saludable;
  const bg = urgent || soon ? tone : tone + "1F";
  const fg = urgent || soon ? colors.onPrimary : tone;
  return (
    <View style={[cntStyles.badge, { backgroundColor: bg }]}>
      <Text style={[cntStyles.text, { color: fg }]}>{urgent ? "HOY" : `${daysLeft}d`}</Text>
    </View>
  );
}
const cntStyles = StyleSheet.create({
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  text: { fontFamily: Typography.family, fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
});

// ─── PlantCard ─────────────────────────────────────────────────────────────────

function PlantCard({
  plant, lastDiagnose, onPress, colors, isDark,
}: {
  plant: PlantDocument;
  lastDiagnose: DiagnoseRecord | null;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const color = lastDiagnose ? clinicColors.health[lastDiagnose.healthStatus] : colors.disabled;
  const label = lastDiagnose ? HEALTH_LABEL[lastDiagnose.healthStatus] : null;
  const { daysLeft, date } = nextDiagnoseDate(lastDiagnose);
  const urgent = daysLeft <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pcStyles.wrap,
        { backgroundColor: colors.surfaceCard, borderColor: urgent ? clinicColors.health.critica + "44" : colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={pcStyles.photoWrap}>
        {plant.photoUri ? (
          <Image source={{ uri: plant.photoUri }} style={pcStyles.photo} />
        ) : (
          <View style={[pcStyles.photo, { backgroundColor: isDark ? "#143018" : "#DCFCE7", alignItems: "center", justifyContent: "center" }]}>
            <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
          </View>
        )}
        <View style={[pcStyles.statusRing, { borderColor: color }]} />
      </View>

      <View style={pcStyles.info}>
        <Text style={[pcStyles.name, { color: colors.text }]} numberOfLines={1}>{plant.name}</Text>
        <Text style={[pcStyles.sci, { color: colors.textSecondary }]} numberOfLines={1}>{plant.scientificName}</Text>
        {label ? (
          <View style={[pcStyles.pill, { backgroundColor: color + "22" }]}>
            <Text style={[pcStyles.pillText, { color }]}>{label}</Text>
          </View>
        ) : (
          <Text style={[pcStyles.nodiag, { color: colors.disabled }]}>Sin diagnóstico</Text>
        )}
      </View>

      <View style={pcStyles.right}>
        <CountdownBadge daysLeft={daysLeft} colors={colors} isDark={isDark} />
        <Text style={[pcStyles.nextDate, { color: colors.textSecondary }]}>{date}</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.disabled} />
      </View>
    </Pressable>
  );
}

const pcStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  photoWrap: { position: "relative" },
  photo: { width: 48, height: 48, borderRadius: 24, resizeMode: "cover" },
  statusRing: { position: "absolute", inset: -2, borderRadius: 26, borderWidth: 2, width: 52, height: 52 },
  info: { flex: 1, gap: 3 },
  name: { fontFamily: Typography.family, fontSize: 14, fontWeight: "800" },
  sci: { fontFamily: Typography.family, fontSize: 11, fontStyle: "italic" },
  pill: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  pillText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700" },
  nodiag: { fontFamily: Typography.family, fontSize: 11, fontStyle: "italic" },
  right: { alignItems: "flex-end", gap: 4 },
  nextDate: { fontFamily: Typography.family, fontSize: 10, fontWeight: "500" },
});

// ─── RecentDiagnosisCard — un diagnóstico puntual del registro global ──────────

function RecentDiagnosisCard({
  record, plant, onPress, colors, isDark,
}: {
  record: DiagnoseRecord;
  plant: PlantDocument;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const color = clinicColors.health[record.healthStatus];
  const photo = record.photoUri ?? plant.photoUri;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rdStyles.wrap,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={rdStyles.photo} />
      ) : (
        <View style={[rdStyles.photo, { backgroundColor: isDark ? "#143018" : "#DCFCE7", alignItems: "center", justifyContent: "center" }]}>
          <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
        </View>
      )}

      <View style={rdStyles.info}>
        <View style={rdStyles.row}>
          <Text style={[rdStyles.name, { color: colors.text }]} numberOfLines={1}>{plant.name}</Text>
          <View style={[rdStyles.pill, { backgroundColor: color + "22" }]}>
            <Text style={[rdStyles.pillText, { color }]}>{HEALTH_LABEL[record.healthStatus]}</Text>
          </View>
        </View>
        <Text style={[rdStyles.summary, { color: colors.textSecondary }]} numberOfLines={2}>{record.healthSummary}</Text>
        <Text style={[rdStyles.date, { color: colors.textSecondary }]}>{formatDate(record.createdAt)}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.disabled} />
    </Pressable>
  );
}

const rdStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  photo: { width: 48, height: 48, borderRadius: BorderRadius.md, resizeMode: "cover" },
  info: { flex: 1, gap: 3 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontFamily: Typography.family, fontSize: 14, fontWeight: "800", flexShrink: 1 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  pillText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700" },
  summary: { fontFamily: Typography.family, fontSize: 11, lineHeight: 15 },
  date: { fontFamily: Typography.family, fontSize: 10, fontWeight: "600" },
});

// ─── DiagnoseEntry (timeline) ──────────────────────────────────────────────────

function DiagnoseEntry({ record, colors, isDark, isLast }: { record: DiagnoseRecord; colors: ThemeColors; isDark: boolean; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const color = clinicColors.health[record.healthStatus];
  const label = HEALTH_LABEL[record.healthStatus];

  return (
    <View style={deStyles.row}>
      {/* Timeline line */}
      <View style={deStyles.timelineCol}>
        <View style={[deStyles.dot, { backgroundColor: color, borderColor: colors.surface }]} />
        {!isLast && <View style={[deStyles.line, { backgroundColor: colors.border }]} />}
      </View>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[deStyles.card, { backgroundColor: colors.surfaceCard, borderColor: color + "44" }]}
      >
        <View style={deStyles.cardHeader}>
          {record.photoUri ? (
            <Image source={{ uri: record.photoUri }} style={deStyles.thumb} />
          ) : null}
          <View style={[deStyles.pill, { backgroundColor: color + "1F" }]}>
            <Text style={[deStyles.pillText, { color }]}>{label}</Text>
          </View>
          <Text style={[deStyles.date, { color: colors.textSecondary }]}>{formatDate(record.createdAt)}</Text>
          <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.disabled} />
        </View>

        <Text style={[deStyles.summary, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
          {record.healthSummary}
        </Text>

        {/* Issues pills always visible */}
        {record.issues.length > 0 && (
          <View style={deStyles.issuesRow}>
            {record.issues.slice(0, expanded ? 99 : 3).map((issue, i) => (
              <View key={i} style={[deStyles.issuePill, { backgroundColor: clinicColors.category[issue.category] + "1F" }]}>
                <MaterialCommunityIcons name={CATEGORY_ICON[issue.category] as never} size={9} color={clinicColors.category[issue.category]} />
                <Text style={[deStyles.issueText, { color: clinicColors.category[issue.category] }]}>{issue.name}</Text>
              </View>
            ))}
          </View>
        )}

        {expanded && (
          <>
            {record.immediateActions.length > 0 && (
              <View style={{ gap: 2, marginTop: 6 }}>
                <Text style={[deStyles.sectionLabel, { color: colors.textSecondary }]}>ACCIONES INMEDIATAS</Text>
                {record.immediateActions.map((a, i) => (
                  <Text key={i} style={[deStyles.actionText, { color: colors.text }]}>→ {a}</Text>
                ))}
              </View>
            )}
            {record.preventiveTips.length > 0 && (
              <View style={{ gap: 2, marginTop: 6 }}>
                <Text style={[deStyles.sectionLabel, { color: colors.textSecondary }]}>PREVENCIÓN FITOPATOLÓGICA</Text>
                {record.preventiveTips.map((t, i) => (
                  <Text key={i} style={[deStyles.actionText, { color: colors.textSecondary }]}>· {t}</Text>
                ))}
              </View>
            )}
            {record.estimatedRecovery && (
              <View style={[deStyles.recoveryWrap, { backgroundColor: clinicColors.health.saludable + "14", borderColor: clinicColors.health.saludable + "55" }]}>
                <MaterialCommunityIcons name="timer-outline" size={13} color={clinicColors.health.saludable} />
                <Text style={[deStyles.recoveryText, { color: clinicColors.health.saludable }]}>Recuperación: {record.estimatedRecovery}</Text>
              </View>
            )}
          </>
        )}
      </Pressable>
    </View>
  );
}

const deStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.sm },
  timelineCol: { alignItems: "center", width: 20, paddingTop: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, zIndex: 1 },
  line: { flex: 1, width: 2, marginTop: 4 },
  card: { flex: 1, borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: 6, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  thumb: { width: 36, height: 36, borderRadius: BorderRadius.sm, resizeMode: "cover" },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },
  pillText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "800" },
  date: { fontFamily: Typography.family, fontSize: 10, fontWeight: "500", flex: 1 },
  summary: { fontFamily: Typography.family, fontSize: 12, lineHeight: 18 },
  issuesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  issuePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  issueText: { fontFamily: Typography.family, fontSize: 9, fontWeight: "700" },
  sectionLabel: { fontFamily: Typography.family, fontSize: 9, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  actionText: { fontFamily: Typography.family, fontSize: 11, lineHeight: 17 },
  recoveryWrap: { flexDirection: "row", alignItems: "center", gap: 5, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: 4 },
  recoveryText: { fontFamily: Typography.family, fontSize: 11, fontWeight: "700" },
});

// ─── PathologyReport — consolidado por categoría ──────────────────────────────

function PathologyReport({ history, colors, isDark }: { history: DiagnoseRecord[]; colors: ThemeColors; isDark: boolean }) {
  const counts: Partial<Record<DiagnoseIssueCategory, number>> = {};
  history.forEach((r) => r.issues.forEach((i) => { counts[i.category] = (counts[i.category] ?? 0) + 1; }));
  const entries = Object.entries(counts) as [DiagnoseIssueCategory, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const clinicColors = getClinicColors(isDark ? "dark" : "light");

  return (
    <View style={[prStyles.wrap, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <View style={prStyles.header}>
        <MaterialCommunityIcons name="microscope" size={13} color={colors.textSecondary} />
        <Text style={[prStyles.title, { color: colors.textSecondary }]}>REPORTE FITOPATOLÓGICO</Text>
      </View>
      {entries.map(([cat, count]) => (
        <View key={cat} style={prStyles.row}>
          <MaterialCommunityIcons name={CATEGORY_ICON[cat] as never} size={14} color={clinicColors.category[cat]} />
          <Text style={[prStyles.catLabel, { color: colors.text }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          <View style={prStyles.barTrack}>
            <View style={[prStyles.barFill, { width: `${Math.min((count / history.length) * 100, 100)}%` as never, backgroundColor: clinicColors.category[cat] }]} />
          </View>
          <Text style={[prStyles.count, { color: clinicColors.category[cat] }]}>{count}×</Text>
        </View>
      ))}
    </View>
  );
}

const prStyles = StyleSheet.create({
  wrap: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  title: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  catLabel: { fontFamily: Typography.family, fontSize: 12, fontWeight: "600", width: 90 },
  barTrack: { flex: 1, height: 4, backgroundColor: "rgba(128,128,128,0.15)", borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  count: { fontFamily: Typography.family, fontSize: 11, fontWeight: "800", width: 28, textAlign: "right" },
});

// ─── PhotoTimeline — registro fotográfico cronológico (time-lapse) ───────────

function PhotoTimeline({ history, colors, isDark }: { history: DiagnoseRecord[]; colors: ThemeColors; isDark: boolean }) {
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const points = useMemo(
    () => [...history].reverse().filter((r) => !!r.photoUri),
    [history],
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (points.length === 0) return null;

  const viewerImages = points.map((r) => ({
    uri: r.photoUri!,
    caption: formatShortDate(r.createdAt),
  }));

  return (
    <View style={ptStyles.wrap}>
      <Text style={[ptStyles.title, { color: colors.textSecondary }]}>REGISTRO FOTOGRÁFICO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ptStyles.row}>
        {points.map((r, i) => (
          <Pressable
            key={r.id}
            style={ptStyles.item}
            accessibilityRole="button"
            accessibilityLabel={`Ver foto del ${formatShortDate(r.createdAt)}`}
            onPress={() => setViewerIndex(i)}
          >
            <View style={ptStyles.photoWrap}>
              <Image source={{ uri: r.photoUri! }} style={ptStyles.photo} />
              <View style={[ptStyles.dot, { backgroundColor: clinicColors.health[r.healthStatus], borderColor: colors.surfaceCard }]} />
            </View>
            <Text style={[ptStyles.date, { color: colors.textSecondary }]}>{formatShortDate(r.createdAt)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FullscreenImageViewer
        visible={viewerIndex !== null}
        images={viewerImages}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const ptStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  title: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  row: { gap: Spacing.sm },
  item: { width: 132, gap: 4, alignItems: "center" },
  photoWrap: { width: 132, height: 176, borderRadius: BorderRadius.md, overflow: "hidden", position: "relative" },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  dot: { position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  date: { fontFamily: Typography.family, fontSize: 10, fontWeight: "600" },
});

// ─── HealthTrendChart — evolución del índice fitosanitario ───────────────────

function HealthTrendChart({ history, colors, isDark }: { history: DiagnoseRecord[]; colors: ThemeColors; isDark: boolean }) {
  const clinicColors = getClinicColors(isDark ? "dark" : "light");
  const points = useMemo(() => [...history].reverse(), [history]);
  const [width, setWidth] = useState(0);
  if (points.length < 2) return null;

  const height = 120;
  const padding = 16;
  const innerW = Math.max(width - padding * 2, 1);
  const stepX = innerW / (points.length - 1);
  const valueToY = (v: number) => padding + (1 - v / 100) * (height - padding * 2);

  const coords = points.map((r, i) => ({
    x: padding + i * stepX,
    y: valueToY(HEALTH_WEIGHT[r.healthStatus]),
    color: clinicColors.health[r.healthStatus],
  }));
  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <View
      style={[htStyles.wrap, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Text style={[htStyles.title, { color: colors.textSecondary }]}>EVOLUCIÓN DEL ÍNDICE FITOSANITARIO</Text>
      {width > 0 && (
        <Svg width={width} height={height}>
          <SvgLine x1={padding} x2={width - padding} y1={valueToY(100)} y2={valueToY(100)} stroke={colors.border} strokeWidth={1} />
          <SvgLine x1={padding} x2={width - padding} y1={valueToY(0)} y2={valueToY(0)} stroke={colors.border} strokeWidth={1} />
          <Polyline points={polylinePoints} fill="none" stroke={colors.primary} strokeWidth={2} />
          {coords.map((c, i) => (
            <Circle key={i} cx={c.x} cy={c.y} r={4} fill={c.color} stroke={colors.surfaceCard} strokeWidth={1.5} />
          ))}
        </Svg>
      )}
      <View style={htStyles.legendRow}>
        <Text style={[htStyles.legendText, { color: colors.textSecondary }]}>{formatShortDate(points[0].createdAt)}</Text>
        <Text style={[htStyles.legendText, { color: colors.textSecondary }]}>{formatShortDate(points[points.length - 1].createdAt)}</Text>
      </View>
    </View>
  );
}

const htStyles = StyleSheet.create({
  wrap: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  title: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  legendRow: { flexDirection: "row", justifyContent: "space-between" },
  legendText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "600" },
});

// ─── PlantClinicModal ──────────────────────────────────────────────────────────

function PlantClinicModal({
  plant, visible, onClose, colors, isDark, initialTab,
}: {
  plant: PlantDocument | null;
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  isDark: boolean;
  initialTab?: "estado" | "historial" | "reporte" | "progreso";
}) {
  const [history, setHistory] = useState<DiagnoseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [tab, setTab] = useState<"estado" | "historial" | "reporte" | "progreso">("estado");
  const clinicColors = getClinicColors(isDark ? "dark" : "light");

  useEffect(() => {
    if (!plant || !visible) return;
    setTab(initialTab ?? "estado");
    setLoading(true);
    getDiagnosesByPlant(plant.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [plant?.id, visible, initialTab]);

  const last = history[0] ?? null;
  const score = healthScore(history);
  const scoreColor = score >= 75 ? clinicColors.health.saludable : score >= 45 ? clinicColors.health.atencion : clinicColors.health.enferma;
  const { daysLeft, date: nextDate } = nextDiagnoseDate(last);

  const runDiagnose = useCallback(async (photoUri: string) => {
    if (!plant) return;
    setDiagnosing(true);
    try {
      const result = await DiagnoseService.diagnoseFromUri(photoUri);
      const record = await saveDiagnose(plant.id, plant.name, result, photoUri);
      setHistory((prev) => [record, ...prev]);
      setTab("estado");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Error al diagnosticar.");
    } finally {
      setDiagnosing(false);
    }
  }, [plant]);

  const handleNewDiagnose = useCallback(() => {
    const opts = [
      {
        text: "Tomar foto con cámara",
        onPress: () => void (async () => {
          const p = await ImagePicker.requestCameraPermissionsAsync();
          if (!p.granted) { Alert.alert("Permiso necesario", "Necesitamos acceso a la cámara."); return; }
          const r = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [3, 4] });
          if (!r.canceled && r.assets[0]) await runDiagnose(r.assets[0].uri);
        })(),
      },
      {
        text: "Elegir de galería",
        onPress: () => void (async () => {
          const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!p.granted) { Alert.alert("Permiso necesario", "Necesitamos acceso a la galería."); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [3, 4] });
          if (!r.canceled && r.assets[0]) await runDiagnose(r.assets[0].uri);
        })(),
      },
      ...(plant?.photoUri ? [{ text: "Usar foto de la planta", onPress: () => void runDiagnose(plant.photoUri!) }] : []),
      { text: "Cancelar", style: "cancel" as const },
    ];
    Alert.alert("Nuevo diagnóstico fitopatológico", "Seleccioná la foto para analizar", opts);
  }, [plant, runDiagnose]);

  if (!plant) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>

        {/* Header */}
        <View style={mStyles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
            <Text style={[mStyles.hTitle, { color: colors.text }]} numberOfLines={1}>{plant.name}</Text>
            <Text style={[mStyles.hSci, { color: colors.textSecondary }]} numberOfLines={1}>{plant.scientificName}</Text>
          </View>
          <Pressable
            onPress={handleNewDiagnose}
            disabled={diagnosing}
            style={({ pressed }) => [mStyles.scanBtn, { backgroundColor: diagnosing ? colors.disabled : colors.primary }, pressed && { opacity: 0.8 }]}
          >
            {diagnosing
              ? <ActivityIndicator size="small" color={colors.onPrimary} />
              : <><MaterialCommunityIcons name="stethoscope" size={15} color={colors.onPrimary} /><Text style={[mStyles.scanBtnText, { color: colors.onPrimary }]}>Analizar</Text></>
            }
          </Pressable>
        </View>

        {/* Score hero */}
        <View style={[mStyles.scoreHero, { backgroundColor: colors.surfaceCard, borderColor: scoreColor + "33" }]}>
          <View style={mStyles.scoreLeft}>
            <Text style={[mStyles.scoreNum, { color: scoreColor, fontVariant: ["tabular-nums"] }]}>{score}</Text>
            <Text style={[mStyles.scoreLabel, { color: colors.textSecondary }]}>ÍNDICE FITOSANITARIO</Text>
            <PulseBar score={score} color={scoreColor} />
          </View>
          <View style={mStyles.scoreDivider} />
          <View style={mStyles.scoreRight}>
            <View style={mStyles.scoreStatRow}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={14} color={colors.textSecondary} />
              <Text style={[mStyles.scoreStatLabel, { color: colors.textSecondary }]}>Diagnósticos</Text>
              <Text style={[mStyles.scoreStatVal, { color: colors.text }]}>{history.length}</Text>
            </View>
            <View style={mStyles.scoreStatRow}>
              <MaterialCommunityIcons name="timer-outline" size={14} color={daysLeft <= 0 ? clinicColors.health.critica : daysLeft <= 3 ? clinicColors.health.atencion : colors.primary} />
              <Text style={[mStyles.scoreStatLabel, { color: colors.textSecondary }]}>Próximo</Text>
              <Text style={[mStyles.scoreStatVal, { color: daysLeft <= 0 ? clinicColors.health.critica : colors.text }]}>
                {daysLeft <= 0 ? "HOY" : `${daysLeft}d — ${nextDate}`}
              </Text>
            </View>
            {last && (
              <View style={mStyles.scoreStatRow}>
                <MaterialCommunityIcons name="calendar-check-outline" size={14} color={colors.textSecondary} />
                <Text style={[mStyles.scoreStatLabel, { color: colors.textSecondary }]}>Último</Text>
                <Text style={[mStyles.scoreStatVal, { color: colors.text }]}>{formatShortDate(last.createdAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[mStyles.tabRow, { borderBottomColor: colors.border }]}>
          {(["estado", "historial", "reporte", "progreso"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={mStyles.tabItem}>
              <Text style={[mStyles.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>
                {t === "estado" ? "Estado" : t === "historial" ? "Historial" : t === "reporte" ? "Reporte" : "Progreso"}
              </Text>
              {tab === t && <View style={[mStyles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={mStyles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={mStyles.tabContent} showsVerticalScrollIndicator={false}>

            {/* ── Tab: Estado ── */}
            {tab === "estado" && (
              <>
                {!last ? (
                  <View style={mStyles.emptyState}>
                    <MaterialCommunityIcons name="stethoscope" size={48} color={colors.textSecondary} />
                    <Text style={[mStyles.emptyTitle, { color: colors.text }]}>Sin diagnósticos</Text>
                    <Text style={[mStyles.emptyBody, { color: colors.textSecondary }]}>
                      Tocá «Analizar» para hacer el primer diagnóstico fitopatológico de esta planta.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Estado actual */}
                    <View style={[mStyles.stateCard, { backgroundColor: colors.surfaceCard, borderColor: clinicColors.health[last.healthStatus] + "55" }]}>
                      <View style={mStyles.stateCardHeader}>
                        {last.photoUri ? (
                          <Image source={{ uri: last.photoUri }} style={mStyles.statePhoto} />
                        ) : null}
                        <View style={mStyles.stateCardHeaderText}>
                          <View style={mStyles.stateCardHeaderRow}>
                            <View style={[mStyles.statePill, { backgroundColor: clinicColors.health[last.healthStatus] + "1F" }]}>
                              <Text style={[mStyles.statePillText, { color: clinicColors.health[last.healthStatus] }]}>
                                {HEALTH_LABEL[last.healthStatus]}
                              </Text>
                            </View>
                            <Text style={[mStyles.stateDate, { color: colors.textSecondary }]}>{formatDate(last.createdAt)}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[mStyles.stateSummary, { color: colors.text }]}>{last.healthSummary}</Text>
                      {last.issues.length > 0 && (
                        <View style={mStyles.issuesWrap}>
                          {last.issues.map((issue, i) => (
                            <View key={i} style={[mStyles.issuePill, { backgroundColor: clinicColors.category[issue.category] + "18" }]}>
                              <MaterialCommunityIcons name={CATEGORY_ICON[issue.category] as never} size={10} color={clinicColors.category[issue.category]} />
                              <Text style={[mStyles.issueText, { color: clinicColors.category[issue.category] }]}>{issue.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {last.immediateActions.length > 0 && (
                        <View style={{ gap: 3, marginTop: 6 }}>
                          <Text style={[mStyles.secLabel, { color: colors.textSecondary }]}>ACCIONES INMEDIATAS</Text>
                          {last.immediateActions.map((a, i) => (
                            <Text key={i} style={[mStyles.actionText, { color: colors.text }]}>→ {a}</Text>
                          ))}
                        </View>
                      )}
                      {last.estimatedRecovery && (
                        <View style={[mStyles.recoveryRow, { backgroundColor: clinicColors.health.saludable + "14", borderColor: clinicColors.health.saludable + "55" }]}>
                          <MaterialCommunityIcons name="timer-outline" size={13} color={clinicColors.health.saludable} />
                          <Text style={[mStyles.recoveryText, { color: clinicColors.health.saludable }]}>Recuperación estimada: {last.estimatedRecovery}</Text>
                        </View>
                      )}
                    </View>

                    {/* Próximos diagnósticos proyectados */}
                    <View style={[mStyles.scheduleCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                      <View style={mStyles.scheduleHeader}>
                        <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
                        <Text style={[mStyles.secLabel, { color: colors.textSecondary }]}>CRONOGRAMA FITOPATOLÓGICO</Text>
                      </View>
                      {[1, 2, 3].map((i) => {
                        const base = new Date(last.createdAt);
                        const interval = RECHECK_DAYS[last.healthStatus];
                        base.setDate(base.getDate() + interval * i);
                        const dayStr = base.toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" });
                        const today = new Date(); today.setHours(0,0,0,0); base.setHours(0,0,0,0);
                        const days = Math.ceil((base.getTime() - today.getTime()) / 86_400_000);
                        return (
                          <View key={i} style={mStyles.scheduleRow}>
                            <View style={[mStyles.scheduleIndex, { backgroundColor: colors.primary + "22" }]}>
                              <Text style={[mStyles.scheduleIndexText, { color: colors.primary }]}>#{i}</Text>
                            </View>
                            <Text style={[mStyles.scheduleDate, { color: colors.text }]}>{dayStr}</Text>
                            <Text style={[mStyles.scheduleDays, { color: days <= 0 ? clinicColors.health.critica : days <= 3 ? clinicColors.health.atencion : colors.textSecondary }]}>
                              {days <= 0 ? "vencido" : `en ${days}d`}
                            </Text>
                          </View>
                        );
                      })}
                      <Text style={[mStyles.scheduleNote, { color: colors.textSecondary }]}>
                        Frecuencia basada en protocolo fitopatológico: cada {RECHECK_DAYS[last.healthStatus]} días para estado {HEALTH_LABEL[last.healthStatus].toLowerCase()}.
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

            {/* ── Tab: Historial ── */}
            {tab === "historial" && (
              history.length === 0 ? (
                <View style={mStyles.emptyState}>
                  <Text style={[mStyles.emptyTitle, { color: colors.text }]}>Sin registros aún</Text>
                </View>
              ) : (
                <View>
                  {history.map((r, i) => (
                    <DiagnoseEntry key={r.id} record={r} colors={colors} isDark={isDark} isLast={i === history.length - 1} />
                  ))}
                </View>
              )
            )}

            {/* ── Tab: Reporte ── */}
            {tab === "reporte" && (
              <>
                <PathologyReport history={history} colors={colors} isDark={isDark} />
                {history.length === 0 && (
                  <View style={mStyles.emptyState}>
                    <Text style={[mStyles.emptyTitle, { color: colors.text }]}>Sin datos para el reporte</Text>
                    <Text style={[mStyles.emptyBody, { color: colors.textSecondary }]}>El reporte se genera automáticamente a medida que se hacen diagnósticos.</Text>
                  </View>
                )}
              </>
            )}

            {/* ── Tab: Progreso ── */}
            {tab === "progreso" && (
              history.filter((r) => !!r.photoUri).length === 0 && history.length < 2 ? (
                <View style={mStyles.emptyState}>
                  <MaterialCommunityIcons name="image-multiple-outline" size={48} color={colors.textSecondary} />
                  <Text style={[mStyles.emptyTitle, { color: colors.text }]}>Aún no hay progreso para mostrar</Text>
                  <Text style={[mStyles.emptyBody, { color: colors.textSecondary }]}>
                    A medida que hagas más diagnósticos con fotos, vas a poder ver acá la evolución de la planta.
                  </Text>
                </View>
              ) : (
                <>
                  <PhotoTimeline history={history} colors={colors} isDark={isDark} />
                  <HealthTrendChart history={history} colors={colors} isDark={isDark} />
                </>
              )
            )}

          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  hTitle: { fontFamily: Typography.family, fontSize: 15, fontWeight: "800" },
  hSci: { fontFamily: Typography.family, fontSize: 11, fontStyle: "italic" },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  scanBtnText: { color: "#fff", fontFamily: Typography.family, fontSize: 12, fontWeight: "700" },
  scoreHero: { marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.sm },
  scoreLeft: { flex: 1, gap: 6 },
  scoreNum: { fontFamily: Typography.family, fontSize: 52, fontWeight: "800", lineHeight: 56, letterSpacing: -2 },
  scoreLabel: { fontFamily: Typography.family, fontSize: 9, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  scoreDivider: { width: 1, backgroundColor: "rgba(128,128,128,0.2)", alignSelf: "stretch" },
  scoreRight: { flex: 1, justifyContent: "center", gap: 8 },
  scoreStatRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  scoreStatLabel: { fontFamily: Typography.family, fontSize: 10, fontWeight: "600", flex: 1 },
  scoreStatVal: { fontFamily: Typography.family, fontSize: 11, fontWeight: "800" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: Spacing.sm },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: Spacing.sm, position: "relative" },
  tabText: { fontFamily: Typography.family, fontSize: 13, fontWeight: "700" },
  tabIndicator: { position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2, borderRadius: 1 },
  tabContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 60 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  emptyState: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyTitle: { fontFamily: Typography.family, fontSize: 15, fontWeight: "800" },
  emptyBody: { fontFamily: Typography.family, fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  stateCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.sm },
  stateCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statePhoto: { width: 56, height: 56, borderRadius: BorderRadius.md, resizeMode: "cover" },
  stateCardHeaderText: { flex: 1, gap: 4 },
  stateCardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  statePillText: { fontFamily: Typography.family, fontSize: 12, fontWeight: "800" },
  stateDate: { fontFamily: Typography.family, fontSize: 11, fontWeight: "500" },
  stateSummary: { fontFamily: Typography.family, fontSize: 13, lineHeight: 20 },
  issuesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  issuePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  issueText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700" },
  secLabel: { fontFamily: Typography.family, fontSize: 9, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" },
  actionText: { fontFamily: Typography.family, fontSize: 12, lineHeight: 18 },
  recoveryRow: { flexDirection: "row", alignItems: "center", gap: 5, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: 2 },
  recoveryText: { fontFamily: Typography.family, fontSize: 11, fontWeight: "700" },
  scheduleCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  scheduleHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  scheduleIndex: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scheduleIndexText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "800" },
  scheduleDate: { fontFamily: Typography.family, fontSize: 12, fontWeight: "600", flex: 1, textTransform: "capitalize" },
  scheduleDays: { fontFamily: Typography.family, fontSize: 11, fontWeight: "700" },
  scheduleNote: { fontFamily: Typography.family, fontSize: 10, fontStyle: "italic", lineHeight: 15, marginTop: 2 },
});

// ─── ClinicScreen ──────────────────────────────────────────────────────────────

export default function ClinicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plantId?: string }>();
  const { colors, isDark } = useAppTheme();
  const { getPlantsByUser, currentUserId } = useDemoData();
  const styles = createStyles(colors, isDark);
  const clinicColors = getClinicColors(isDark ? "dark" : "light");

  const userPlants = getPlantsByUser(currentUserId);
  const openedFromParam = useRef(false);
  const [lastDiagnoses, setLastDiagnoses] = useState<Record<string, DiagnoseRecord | null>>({});
  const [historyByPlant, setHistoryByPlant] = useState<Record<string, DiagnoseRecord[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<PlantDocument | null>(null);
  const [selectedInitialTab, setSelectedInitialTab] = useState<"estado" | "historial">("estado");
  const [selectedDate, setSelectedDate] = useState<string>(ISO_TODAY);
  const [viewMode, setViewMode] = useState<"agenda" | "diagnosticos">("agenda");
  const [diagFilter, setDiagFilter] = useState<DiagnoseHealthStatus | "recientes" | "sindatos">("recientes");

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < CLINIC_DAYS_AHEAD; i += 1) arr.push(addDaysIso(ISO_TODAY, i));
    return arr;
  }, []);

  useEffect(() => {
    if (userPlants.length === 0) { setLoadingHistory(false); return; }
    let cancelled = false;
    Promise.all(
      userPlants.map(async (p) => {
        try {
          const records = await getDiagnosesByPlant(p.id);
          return { id: p.id, records };
        } catch { return { id: p.id, records: [] as DiagnoseRecord[] }; }
      })
    ).then((results) => {
      if (cancelled) return;
      const histMap: Record<string, DiagnoseRecord[]> = {};
      const lastMap: Record<string, DiagnoseRecord | null> = {};
      results.forEach((r) => {
        histMap[r.id] = r.records;
        lastMap[r.id] = r.records[0] ?? null;
      });
      setHistoryByPlant(histMap);
      setLastDiagnoses(lastMap);
      setLoadingHistory(false);
    });
    return () => { cancelled = true; };
  }, [userPlants.length]);

  // Diagnósticos más recientes de toda la colección, sin importar la planta.
  const recentDiagnoses = useMemo(() => {
    const plantById = new Map(userPlants.map((p) => [p.id, p]));
    const all: { record: DiagnoseRecord; plant: PlantDocument }[] = [];
    Object.entries(historyByPlant).forEach(([plantId, records]) => {
      const plant = plantById.get(plantId);
      if (!plant) return;
      records.forEach((record) => all.push({ record, plant }));
    });
    return all
      .sort((a, b) => b.record.createdAt.localeCompare(a.record.createdAt))
      .slice(0, 30);
  }, [historyByPlant, userPlants]);

  // Plantas agrupadas por su estado de salud más reciente, para control por gravedad.
  const plantsByStatus = useMemo(() => {
    const groups: Record<DiagnoseHealthStatus | "sindatos", PlantDocument[]> = {
      saludable: [], atencion: [], enferma: [], critica: [], sindatos: [],
    };
    userPlants.forEach((p) => {
      const status = lastDiagnoses[p.id]?.healthStatus;
      if (status) groups[status].push(p);
      else groups.sindatos.push(p);
    });
    return groups;
  }, [userPlants, lastDiagnoses]);

  // Si venimos del detalle de una planta (?plantId=), abrimos su clínica directo.
  useEffect(() => {
    if (openedFromParam.current || !params.plantId) return;
    const target = userPlants.find((p) => p.id === params.plantId);
    if (target) {
      setSelectedPlant(target);
      openedFromParam.current = true;
    }
  }, [params.plantId, userPlants]);

  // Ordenar: urgentes primero (daysLeft <= 0), luego por daysLeft asc
  const sortedPlants = useMemo(() => {
    return [...userPlants].sort((a, b) => {
      const da = nextDiagnoseDate(lastDiagnoses[a.id] ?? null).daysLeft;
      const db = nextDiagnoseDate(lastDiagnoses[b.id] ?? null).daysLeft;
      return da - db;
    });
  }, [userPlants, lastDiagnoses]);

  const urgent = sortedPlants.filter((p) => nextDiagnoseDate(lastDiagnoses[p.id] ?? null).daysLeft <= 0).length;
  const healthy = userPlants.filter((p) => lastDiagnoses[p.id]?.healthStatus === "saludable").length;
  const withIssues = userPlants.filter((p) => {
    const s = lastDiagnoses[p.id]?.healthStatus;
    return s === "atencion" || s === "enferma" || s === "critica";
  }).length;
  const undiagnosed = userPlants.filter((p) => !lastDiagnoses[p.id]).length;
  const avgScore = userPlants.length > 0
    ? Math.round(userPlants.reduce((sum, p) => {
        const h = lastDiagnoses[p.id] ? [lastDiagnoses[p.id]!] : [];
        return sum + healthScore(h);
      }, 0) / userPlants.length)
    : 0;

  // Bucket de cada planta: el día recomendado de su próximo diagnóstico
  // (los vencidos se agrupan en hoy).
  const bucketFor = useCallback(
    (plantId: string) => {
      const iso = nextDiagnoseIso(lastDiagnoses[plantId] ?? null);
      return iso < ISO_TODAY ? ISO_TODAY : iso;
    },
    [lastDiagnoses],
  );

  const recommendedDays = useMemo(() => {
    const set = new Set<string>();
    userPlants.forEach((p) => set.add(bucketFor(p.id)));
    return set;
  }, [userPlants, bucketFor]);

  const doneDays = useMemo(() => {
    const set = new Set<string>();
    Object.values(lastDiagnoses).forEach((d) => {
      if (d) set.add(d.createdAt.slice(0, 10));
    });
    return set;
  }, [lastDiagnoses]);

  const plantsForDay = useMemo(
    () => sortedPlants.filter((p) => bucketFor(p.id) === selectedDate),
    [sortedPlants, bucketFor, selectedDate],
  );

  const dayLabel = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Clínica Fitopatológica</Text>
          <Text style={styles.headerSub}>Diagnóstico de salud vegetal</Text>
        </View>
        {urgent > 0 && (
          <View style={[styles.urgentBadge, { backgroundColor: clinicColors.health.critica }]}>
            <Text style={[styles.urgentText, { color: colors.onPrimary }]}>{urgent} urgente{urgent > 1 ? "s" : ""}</Text>
          </View>
        )}
      </View>

      <View style={[styles.modeToggle, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setViewMode("agenda")}
          style={[styles.modeBtn, viewMode === "agenda" && [styles.modeBtnActive, { backgroundColor: colors.primary }]]}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={14} color={viewMode === "agenda" ? colors.onPrimary : colors.textSecondary} />
          <Text style={[styles.modeBtnText, { color: viewMode === "agenda" ? colors.onPrimary : colors.textSecondary }]}>Agenda</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode("diagnosticos")}
          style={[styles.modeBtn, viewMode === "diagnosticos" && [styles.modeBtnActive, { backgroundColor: colors.primary }]]}
        >
          <MaterialCommunityIcons name="clipboard-pulse-outline" size={14} color={viewMode === "diagnosticos" ? colors.onPrimary : colors.textSecondary} />
          <Text style={[styles.modeBtnText, { color: viewMode === "diagnosticos" ? colors.onPrimary : colors.textSecondary }]}>Diagnósticos</Text>
        </Pressable>
      </View>

      {viewMode === "agenda" ? (
        <DayStrip
          days={days}
          selected={selectedDate}
          todayIso={ISO_TODAY}
          onSelect={setSelectedDate}
          markFor={(iso) => ({
            primary: recommendedDays.has(iso),
            secondary: doneDays.has(iso),
          })}
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {DIAG_FILTERS.map((f) => {
            const count = f.key === "recientes" ? recentDiagnoses.length : plantsByStatus[f.key].length;
            const dotColor = f.key === "recientes" ? colors.primary : f.key === "sindatos" ? colors.disabled : clinicColors.health[f.key];
            const active = diagFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setDiagFilter(f.key)}
                style={[
                  styles.filterChip,
                  { borderColor: active ? dotColor : colors.border, backgroundColor: active ? dotColor + "1A" : colors.surfaceCard },
                ]}
              >
                <View style={[styles.filterDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.filterText, { color: active ? dotColor : colors.text }]}>{f.label}</Text>
                <Text style={[styles.filterCount, { color: colors.textSecondary }]}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {loadingHistory ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : viewMode === "agenda" ? (
        <FlatList
          data={plantsForDay}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Panel de salud global */}
              <View style={[styles.globalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={styles.globalHeader}>
                  <MaterialCommunityIcons name="dna" size={15} color={colors.primary} />
                  <Text style={[styles.globalTitle, { color: colors.textSecondary }]}>SALUD DEL JARDÍN</Text>
                  <Text style={[styles.globalScore, { color: avgScore >= 75 ? clinicColors.health.saludable : avgScore >= 45 ? clinicColors.health.atencion : clinicColors.health.enferma }]}>
                    {avgScore}/100
                  </Text>
                </View>
                <PulseBar score={avgScore} color={avgScore >= 75 ? clinicColors.health.saludable : avgScore >= 45 ? clinicColors.health.atencion : clinicColors.health.enferma} />
                <View style={styles.globalStats}>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: clinicColors.health.saludable }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{healthy}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>sanas</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: clinicColors.health.atencion }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{withIssues}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>con alerta</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: colors.disabled }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{undiagnosed}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>sin datos</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: clinicColors.health.critica }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{urgent}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>urgentes</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.dayTitle, { color: colors.text }]}>
                {dayLabel}
              </Text>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {selectedDate === ISO_TODAY
                  ? "REVISIONES DE HOY Y VENCIDAS"
                  : "REVISIONES RECOMENDADAS"}
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              lastDiagnose={lastDiagnoses[item.id] ?? null}
              onPress={() => {
                setSelectedInitialTab("estado");
                setSelectedPlant(item);
              }}
              colors={colors}
              isDark={isDark}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="calendar-check-outline" size={44} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nada para este día</Text>
              <Text style={[styles.headerSub, { textAlign: "center" }]}>
                Tocá otro día en la tira para ver sus revisiones.
              </Text>
            </View>
          }
        />
      ) : diagFilter === "recientes" ? (
        <FlatList
          data={recentDiagnoses}
          keyExtractor={(item) => item.record.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecentDiagnosisCard
              record={item.record}
              plant={item.plant}
              onPress={() => {
                setSelectedInitialTab("historial");
                setSelectedPlant(item.plant);
              }}
              colors={colors}
              isDark={isDark}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={44} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin diagnósticos aún</Text>
              <Text style={[styles.headerSub, { textAlign: "center" }]}>
                Cuando diagnostiques una planta, aparecerá aquí.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={plantsByStatus[diagFilter]}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              lastDiagnose={lastDiagnoses[item.id] ?? null}
              onPress={() => {
                setSelectedInitialTab("estado");
                setSelectedPlant(item);
              }}
              colors={colors}
              isDark={isDark}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="leaf-off" size={44} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nada en esta categoría</Text>
              <Text style={[styles.headerSub, { textAlign: "center" }]}>
                Probá con otro filtro de gravedad.
              </Text>
            </View>
          }
        />
      )}

      <PlantClinicModal
        plant={selectedPlant}
        visible={selectedPlant !== null}
        onClose={() => setSelectedPlant(null)}
        initialTab={selectedInitialTab}
        colors={colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    headerBar: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
    headerTitle: { color: colors.text, fontFamily: Typography.family, fontSize: 17, fontWeight: "800" },
    headerSub: { color: colors.textSecondary, fontFamily: Typography.family, fontSize: 11, fontWeight: "600" },
    urgentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
    urgentText: { fontFamily: Typography.family, fontSize: 11, fontWeight: "800" },
    list: { padding: Spacing.lg, paddingBottom: 120 },
    globalCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
    globalHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    globalTitle: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.7, flex: 1 },
    globalScore: { fontFamily: Typography.family, fontSize: 16, fontWeight: "800" },
    globalStats: { flexDirection: "row", marginTop: 4 },
    globalStat: { flex: 1, alignItems: "center", gap: 3 },
    globalDot: { width: 8, height: 8, borderRadius: 4 },
    globalStatVal: { fontFamily: Typography.family, fontSize: 18, fontWeight: "800" },
    globalStatLbl: { fontFamily: Typography.family, fontSize: 10, fontWeight: "600" },
    dayTitle: { fontFamily: Typography.serif, fontSize: 22, fontWeight: "700", letterSpacing: -0.3, textTransform: "capitalize", marginBottom: 2 },
    sectionLabel: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: Spacing.sm },
    emptyWrap: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.md },
    emptyTitle: { fontFamily: Typography.family, fontSize: 15, fontWeight: "800" },
    modeToggle: {
      flexDirection: "row",
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      padding: 3,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      gap: 3,
    },
    modeBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
    },
    modeBtnActive: {},
    modeBtnText: { fontFamily: Typography.family, fontSize: 12, fontWeight: "700" },
    filterRow: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    filterDot: { width: 7, height: 7, borderRadius: 4 },
    filterText: { fontFamily: Typography.family, fontSize: 12, fontWeight: "700" },
    filterCount: { fontFamily: Typography.family, fontSize: 11, fontWeight: "600" },
  });
