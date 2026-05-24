import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
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
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

interface WateringTask {
  plantId: string;
  plantName: string;
  scientificName: string;
  date: string;
  cycleDays: number;
}

const ISO_TODAY = new Date().toISOString().slice(0, 10);

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

const RANGE_MONTHS_AHEAD = 3;

export default function CalendarScreen() {
  const { colors, isDark } = useAppTheme();
  const { plants } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [selectedDate, setSelectedDate] = useState<string>(ISO_TODAY);

  // Generar tareas de riego para los proximos N meses
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
        tasks.push({
          plantId: plant.id,
          plantName: plant.name,
          scientificName: plant.scientificName,
          date: current,
          cycleDays: cycle,
        });
        current = addDays(current, cycle);
      }
    });

    return tasks;
  }, [plants]);

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
    > = {};

    allTasks.forEach((task) => {
      if (!marks[task.date]) {
        marks[task.date] = { marked: true, dotColor: colors.primary };
      }
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    };

    return marks;
  }, [allTasks, selectedDate, colors.primary]);

  const tasksForSelectedDay = useMemo(
    () => allTasks.filter((t) => t.date === selectedDate),
    [allTasks, selectedDate],
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Calendario" subtitle="Riegos y tareas" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <Calendar
            current={ISO_TODAY}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
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

        <Text style={styles.dayHeaderTitle}>
          {isoToFriendly(selectedDate)}
        </Text>

        {tasksForSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>Sin tareas para este dia.</Text>
        ) : (
          tasksForSelectedDay.map((task) => (
            <View key={`${task.plantId}-${task.date}`} style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <MaterialCommunityIcons
                  name="water"
                  size={20}
                  color={colors.onPrimary}
                />
              </View>
              <View style={styles.taskBody}>
                <Text style={styles.taskTitle}>Regar {task.plantName}</Text>
                <Text style={styles.taskSubtitle}>
                  {task.scientificName} - cada {task.cycleDays} dias
                </Text>
              </View>
            </View>
          ))
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
      paddingHorizontal: Spacing.lg,
      paddingBottom: 120,
      gap: Spacing.md,
    },
    calendarCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      overflow: "hidden",
    },
    dayHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
      textTransform: "capitalize",
      marginTop: Spacing.sm,
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
      width: 38,
      height: 38,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    taskBody: {
      flex: 1,
      gap: 2,
    },
    taskTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    taskSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
      paddingVertical: Spacing.md,
    },
  });
