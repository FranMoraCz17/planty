import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import type { ChatUser } from "@/src/services/chatService";
import { useChat } from "./ChatProvider";
import { createStyles } from "./MessagingScreen.styles";

// Color estable de avatar a partir del texto (mismo nombre → mismo color).
const AVATAR_COLORS = ["#10B981", "#06B6D4", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6"];
function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MessagingScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { connection, error, me, onlineUsers, groupMessages } = useChat();

  // Otros usuarios conectados (sin contarme a mí).
  const members = onlineUsers.filter((u) => u.id !== me?.id);

  const lastGroup = groupMessages[groupMessages.length - 1];
  const groupPreview = lastGroup
    ? `${lastGroup.sender_nickname}: ${lastGroup.content}`
    : "Conversación general de la comunidad";

  const openGroup = () => router.push("/(app)/chat/group");
  const openDm = (user: ChatUser) =>
    router.push({
      pathname: "/(app)/chat/[userId]",
      params: { userId: user.id, nickname: user.nickname },
    });

  const isConnecting = connection === "connecting" && onlineUsers.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>Mensajería</Text>
          <Text style={styles.headerSubtitle}>
            {me ? me.nickname : "…"}
            {connection === "online" ? " · Conectado" : connection === "connecting" ? " · Conectando…" : " · Sin conexión"}
          </Text>
        </View>
        {connection === "online" && <View style={styles.onlineDot} />}
      </View>

      {isConnecting ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centeredText}>
            Conectando al chat… (el servidor puede tardar unos segundos en despertar)
          </Text>
        </View>
      ) : (
        <ScrollView>
          {error && (
            <Text style={[styles.centeredText, { paddingTop: 12 }]}>{error}</Text>
          )}

          <Text style={styles.sectionLabel}>General</Text>
          <Pressable
            accessibilityRole="button"
            onPress={openGroup}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.avatar, styles.avatarGroup]}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.onPrimary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Chat grupal</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {groupPreview}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.sectionLabel}>
            En línea ({members.length})
          </Text>

          {members.length === 0 ? (
            <Text style={styles.emptyMembers}>
              No hay otros usuarios conectados ahora mismo.
            </Text>
          ) : (
            members.map((user) => (
              <Pressable
                key={user.id}
                accessibilityRole="button"
                onPress={() => openDm(user)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.avatarWrap}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(user.nickname) }]}>
                    <Text style={styles.avatarText}>
                      {user.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rowDot} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{user.nickname}</Text>
                  <Text style={styles.rowSubtitle}>Toca para iniciar un chat</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
