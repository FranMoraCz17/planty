import { ScrollView, StyleSheet, Text, Pressable } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type FilterPill = {
  id: string;
  label: string;
};

const FILTERS: FilterPill[] = [
  { id: "all", label: "Todo" },
  { id: "species", label: "Especies" },
  { id: "symptoms", label: "Síntomas" },
  { id: "guides", label: "Guías" },
  { id: "pests", label: "Plagas" },
];

interface SearchFilterPillsProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

export default function SearchFilterPills({
  activeFilter,
  onFilterChange,
}: SearchFilterPillsProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => (
        <Pressable
          key={filter.id}
          onPress={() => onFilterChange(filter.id)}
          style={[styles.pill, activeFilter === filter.id && styles.activePill]}
        >
          <Text
            style={[
              styles.pillText,
              activeFilter === filter.id && styles.activePillText,
            ]}
          >
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    pill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 1,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceCard,
    },
    activePill: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    pillText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "600",
    },
    activePillText: {
      color: colors.surface,
    },
  });
