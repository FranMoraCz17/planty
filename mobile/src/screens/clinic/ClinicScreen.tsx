import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
import { useDemoData } from "@/src/data/DemoDataProvider";
import DiagnoseService from "@/src/services/diagnoseService";
import {
  getDiagnosesByPlant,
  saveDiagnose,
  type DiagnoseRecord,
} from "@/src/services/diagnoseHistoryService";
import type { DiagnoseIssueCategory } from "@/src/services/diagnoseService";
import type { PlantDocument } from "@/src/services/plantService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

// ─── Fitopatología: constantes científicas ────────────────────────────────────

const HEALTH_COLOR: Record<string, string> = {
  saludable: "#16A34A",
  atencion:  "#D97706",
  enferma:   "#DC2626",
  critica:   "#7F1D1D",
};
const HEALTH_LABEL: Record<string, string> = {
  saludable: "Saludable",
  atencion:  "Atención",
  enferma:   "Enferma",
  critica:   "Crítica",
};
// Días entre diagnósticos según severidad del último resultado (protocolo fitopatológico)
const RECHECK_DAYS: Record<string, number> = {
  saludable: 30,
  atencion:  14,
  enferma:   7,
  critica:   3,
};
const CATEGORY_ICON: Record<DiagnoseIssueCategory, string> = {
  plaga:        "bug-outline",
  enfermedad:   "virus-outline",
  deficiencia:  "water-minus-outline",
  exceso:       "water-plus-outline",
  ambiental:    "thermometer-alert",
};
const CATEGORY_COLOR: Record<DiagnoseIssueCategory, string> = {
  plaga:        "#DC2626",
  enfermedad:   "#9333EA",
  deficiencia:  "#D97706",
  exceso:       "#0284C7",
  ambiental:    "#64748B",
};

// Calcula días hasta el próximo diagnóstico recomendado
function nextDiagnoseDate(last: DiagnoseRecord | null): { date: string; daysLeft: number } {
  const base = last ? new Date(last.createdAt) : new Date();
  const interval = last ? (RECHECK_DAYS[last.healthStatus] ?? 30) : 0;
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
  const weights: Record<string, number> = { saludable: 100, atencion: 60, enferma: 25, critica: 0 };
  const sum = history.reduce((acc, r) => acc + (weights[r.healthStatus] ?? 50), 0);
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
  const urgent = daysLeft <= 0;
  const soon = daysLeft <= 3 && daysLeft > 0;
  const bg = urgent ? "#DC2626" : soon ? "#D97706" : (isDark ? "#143018" : "#DCFCE7");
  const fg = urgent || soon ? "#fff" : colors.primary;
  const label = urgent ? "HOY" : soon ? `${daysLeft}d` : `${daysLeft}d`;
  return (
    <View style={[cntStyles.badge, { backgroundColor: bg }]}>
      <Text style={[cntStyles.text, { color: fg }]}>{label}</Text>
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
  const color = lastDiagnose ? (HEALTH_COLOR[lastDiagnose.healthStatus] ?? colors.textSecondary) : colors.disabled;
  const label = lastDiagnose ? (HEALTH_LABEL[lastDiagnose.healthStatus] ?? "") : null;
  const { daysLeft, date } = nextDiagnoseDate(lastDiagnose);
  const urgent = daysLeft <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pcStyles.wrap,
        { backgroundColor: colors.surfaceCard, borderColor: urgent ? "#DC262644" : colors.border },
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

// ─── DiagnoseEntry (timeline) ──────────────────────────────────────────────────

function DiagnoseEntry({ record, colors, isDark, isLast }: { record: DiagnoseRecord; colors: ThemeColors; isDark: boolean; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = HEALTH_COLOR[record.healthStatus] ?? colors.textSecondary;
  const label = HEALTH_LABEL[record.healthStatus] ?? record.healthStatus;

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
          <View style={[deStyles.pill, { backgroundColor: color + "22" }]}>
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
              <View key={i} style={[deStyles.issuePill, { backgroundColor: (CATEGORY_COLOR[issue.category] ?? "#888") + "22" }]}>
                <MaterialCommunityIcons name={CATEGORY_ICON[issue.category] as never ?? "alert"} size={9} color={CATEGORY_COLOR[issue.category] ?? "#888"} />
                <Text style={[deStyles.issueText, { color: CATEGORY_COLOR[issue.category] ?? "#888" }]}>{issue.name}</Text>
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
              <View style={[deStyles.recoveryWrap, { backgroundColor: isDark ? "#0F2318" : "#F0FDF4", borderColor: "#BBF7D0" }]}>
                <MaterialCommunityIcons name="timer-outline" size={13} color="#16A34A" />
                <Text style={[deStyles.recoveryText, { color: "#16A34A" }]}>Recuperación: {record.estimatedRecovery}</Text>
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

  return (
    <View style={[prStyles.wrap, { backgroundColor: isDark ? "#0A0A0A" : "#F8F8F8", borderColor: colors.border }]}>
      <View style={prStyles.header}>
        <MaterialCommunityIcons name="microscope" size={13} color={colors.textSecondary} />
        <Text style={[prStyles.title, { color: colors.textSecondary }]}>REPORTE FITOPATOLÓGICO</Text>
      </View>
      {entries.map(([cat, count]) => (
        <View key={cat} style={prStyles.row}>
          <MaterialCommunityIcons name={CATEGORY_ICON[cat] as never} size={14} color={CATEGORY_COLOR[cat]} />
          <Text style={[prStyles.catLabel, { color: colors.text }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          <View style={prStyles.barTrack}>
            <View style={[prStyles.barFill, { width: `${Math.min((count / history.length) * 100, 100)}%` as never, backgroundColor: CATEGORY_COLOR[cat] }]} />
          </View>
          <Text style={[prStyles.count, { color: CATEGORY_COLOR[cat] }]}>{count}×</Text>
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

// ─── PlantClinicModal ──────────────────────────────────────────────────────────

function PlantClinicModal({
  plant, visible, onClose, colors, isDark,
}: {
  plant: PlantDocument | null;
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const [history, setHistory] = useState<DiagnoseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [tab, setTab] = useState<"estado" | "historial" | "reporte">("estado");

  useEffect(() => {
    if (!plant || !visible) return;
    setTab("estado");
    setLoading(true);
    getDiagnosesByPlant(plant.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [plant?.id, visible]);

  const last = history[0] ?? null;
  const score = healthScore(history);
  const scoreColor = score >= 75 ? HEALTH_COLOR.saludable : score >= 45 ? HEALTH_COLOR.atencion : HEALTH_COLOR.enferma;
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
            style={({ pressed }) => [mStyles.scanBtn, { backgroundColor: diagnosing ? colors.disabled : "#D97706" }, pressed && { opacity: 0.8 }]}
          >
            {diagnosing
              ? <ActivityIndicator size="small" color="#fff" />
              : <><MaterialCommunityIcons name="stethoscope" size={15} color="#fff" /><Text style={mStyles.scanBtnText}>Analizar</Text></>
            }
          </Pressable>
        </View>

        {/* Score hero */}
        <View style={[mStyles.scoreHero, { backgroundColor: isDark ? "#0D1A0D" : "#F0FDF4" }]}>
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
              <MaterialCommunityIcons name="timer-outline" size={14} color={daysLeft <= 0 ? "#DC2626" : daysLeft <= 3 ? "#D97706" : colors.primary} />
              <Text style={[mStyles.scoreStatLabel, { color: colors.textSecondary }]}>Próximo</Text>
              <Text style={[mStyles.scoreStatVal, { color: daysLeft <= 0 ? "#DC2626" : colors.text }]}>
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
          {(["estado", "historial", "reporte"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={mStyles.tabItem}>
              <Text style={[mStyles.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>
                {t === "estado" ? "Estado" : t === "historial" ? "Historial" : "Reporte"}
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
                      Tocá "Analizar" para hacer el primer diagnóstico fitopatológico de esta planta.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Estado actual */}
                    <View style={[mStyles.stateCard, { backgroundColor: colors.surfaceCard, borderColor: (HEALTH_COLOR[last.healthStatus] ?? colors.border) + "55" }]}>
                      <View style={mStyles.stateCardHeader}>
                        <View style={[mStyles.statePill, { backgroundColor: (HEALTH_COLOR[last.healthStatus] ?? "#888") + "22" }]}>
                          <Text style={[mStyles.statePillText, { color: HEALTH_COLOR[last.healthStatus] ?? "#888" }]}>
                            {HEALTH_LABEL[last.healthStatus] ?? last.healthStatus}
                          </Text>
                        </View>
                        <Text style={[mStyles.stateDate, { color: colors.textSecondary }]}>{formatDate(last.createdAt)}</Text>
                      </View>
                      <Text style={[mStyles.stateSummary, { color: colors.text }]}>{last.healthSummary}</Text>
                      {last.issues.length > 0 && (
                        <View style={mStyles.issuesWrap}>
                          {last.issues.map((issue, i) => (
                            <View key={i} style={[mStyles.issuePill, { backgroundColor: (CATEGORY_COLOR[issue.category] ?? "#888") + "18" }]}>
                              <MaterialCommunityIcons name={CATEGORY_ICON[issue.category] as never} size={10} color={CATEGORY_COLOR[issue.category] ?? "#888"} />
                              <Text style={[mStyles.issueText, { color: CATEGORY_COLOR[issue.category] ?? "#888" }]}>{issue.name}</Text>
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
                        <View style={[mStyles.recoveryRow, { backgroundColor: isDark ? "#0F2318" : "#F0FDF4", borderColor: "#BBF7D0" }]}>
                          <MaterialCommunityIcons name="timer-outline" size={13} color="#16A34A" />
                          <Text style={mStyles.recoveryText}>Recuperación estimada: {last.estimatedRecovery}</Text>
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
                        const interval = RECHECK_DAYS[last.healthStatus] ?? 30;
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
                            <Text style={[mStyles.scheduleDays, { color: days <= 0 ? "#DC2626" : days <= 3 ? "#D97706" : colors.textSecondary }]}>
                              {days <= 0 ? "vencido" : `en ${days}d`}
                            </Text>
                          </View>
                        );
                      })}
                      <Text style={[mStyles.scheduleNote, { color: colors.textSecondary }]}>
                        Frecuencia basada en protocolo fitopatológico: cada {RECHECK_DAYS[last.healthStatus] ?? 30} días para estado {HEALTH_LABEL[last.healthStatus]?.toLowerCase()}.
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
  recoveryText: { fontFamily: Typography.family, fontSize: 11, fontWeight: "700", color: "#16A34A" },
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
  const { colors, isDark } = useAppTheme();
  const { getPlantsByUser, currentUserId } = useDemoData();
  const styles = createStyles(colors, isDark);

  const userPlants = getPlantsByUser(currentUserId);
  const [lastDiagnoses, setLastDiagnoses] = useState<Record<string, DiagnoseRecord | null>>({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<PlantDocument | null>(null);

  useEffect(() => {
    if (userPlants.length === 0) { setLoadingHistory(false); return; }
    let cancelled = false;
    Promise.all(
      userPlants.map(async (p) => {
        try {
          const records = await getDiagnosesByPlant(p.id);
          return { id: p.id, last: records[0] ?? null };
        } catch { return { id: p.id, last: null }; }
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, DiagnoseRecord | null> = {};
      results.forEach((r) => { map[r.id] = r.last; });
      setLastDiagnoses(map);
      setLoadingHistory(false);
    });
    return () => { cancelled = true; };
  }, [userPlants.length]);

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
          <View style={[styles.urgentBadge, { backgroundColor: "#DC2626" }]}>
            <Text style={styles.urgentText}>{urgent} urgente{urgent > 1 ? "s" : ""}</Text>
          </View>
        )}
      </View>

      {loadingHistory ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sortedPlants}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Panel de salud global */}
              <View style={[styles.globalCard, { backgroundColor: isDark ? "#0D1A0D" : "#F0FDF4", borderColor: "#BBF7D0" }]}>
                <View style={styles.globalHeader}>
                  <MaterialCommunityIcons name="dna" size={15} color={colors.primary} />
                  <Text style={[styles.globalTitle, { color: colors.textSecondary }]}>SALUD DEL JARDÍN</Text>
                  <Text style={[styles.globalScore, { color: avgScore >= 75 ? HEALTH_COLOR.saludable : avgScore >= 45 ? HEALTH_COLOR.atencion : HEALTH_COLOR.enferma }]}>
                    {avgScore}/100
                  </Text>
                </View>
                <PulseBar score={avgScore} color={avgScore >= 75 ? HEALTH_COLOR.saludable : avgScore >= 45 ? HEALTH_COLOR.atencion : HEALTH_COLOR.enferma} />
                <View style={styles.globalStats}>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: HEALTH_COLOR.saludable }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{healthy}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>sanas</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: HEALTH_COLOR.atencion }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{withIssues}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>con alerta</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: colors.disabled }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{undiagnosed}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>sin datos</Text>
                  </View>
                  <View style={styles.globalStat}>
                    <View style={[styles.globalDot, { backgroundColor: "#DC2626" }]} />
                    <Text style={[styles.globalStatVal, { color: colors.text }]}>{urgent}</Text>
                    <Text style={[styles.globalStatLbl, { color: colors.textSecondary }]}>urgentes</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PLANTAS — ordenadas por urgencia
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              lastDiagnose={lastDiagnoses[item.id] ?? null}
              onPress={() => setSelectedPlant(item)}
              colors={colors}
              isDark={isDark}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="leaf-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin plantas</Text>
            </View>
          }
        />
      )}

      <PlantClinicModal
        plant={selectedPlant}
        visible={selectedPlant !== null}
        onClose={() => setSelectedPlant(null)}
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
    urgentText: { color: "#fff", fontFamily: Typography.family, fontSize: 11, fontWeight: "800" },
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
    sectionLabel: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: Spacing.sm },
    emptyWrap: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.md },
    emptyTitle: { fontFamily: Typography.family, fontSize: 15, fontWeight: "800" },
  });
