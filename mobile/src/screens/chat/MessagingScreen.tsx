import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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

function formatTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessagingScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const {
    connection,
    error,
    me,
    onlineUsers,
    groupMessages,
    getThread,
    unreadCount,
  } = useChat();

  const [search, setSearch] = useState("");

  // Otros usuarios conectados (sin contarme a mí), filtrados por el buscador.
  const members = useMemo(() => {
    const others = onlineUsers.filter((u) => u.id !== me?.id);
    const term = search.trim().toLowerCase();
    if (!term) return others;
    return others.filter((u) => u.nickname.toLowerCase().includes(term));
  }, [onlineUsers, me?.id, search]);

  const lastGroup = groupMessages[groupMessages.length - 1];
  const groupPreview = lastGroup
    ? `${lastGroup.sender_nickname}: ${lastGroup.content}`
    : "Conversación general de la comunidad";
  const groupUnread = unreadCount({ kind: "group" });

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
        <ScrollView keyboardShouldPersistTaps="handled">
          {error && (
            <Text style={[styles.centeredText, { paddingTop: 12 }]}>{error}</Text>
          )}

          <View style={styles.searchWrap}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar a quién escribirle…"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                onPress={() => setSearch("")}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          <Text style={styles.sectionLabel}>General</Text>
          <Pressable
            accessibilityRole="button"
            onPress={openGroup}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.avatar, styles.avatarGroup]}>
              <MaterialCommunityIcons name="sprout" size={24} color={colors.onPrimary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Chat grupal</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {groupPreview}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowTime}>{formatTime(lastGroup?.timestamp)}</Text>
              {groupUnread > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {groupUnread > 99 ? "99+" : groupUnread}
                  </Text>
                </View>
              ) : (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
            </View>
          </Pressable>

          <Text style={styles.sectionLabel}>
            En línea ({members.length})
          </Text>

          {members.length === 0 ? (
            <Text style={styles.emptyMembers}>
              {search.trim()
                ? `Nadie en línea coincide con "${search.trim()}".`
                : "No hay otros usuarios conectados ahora mismo."}
            </Text>
          ) : (
            members.map((user) => {
              const thread = getThread(user.id);
              const lastDm = thread[thread.length - 1];
              const dmUnread = unreadCount({ kind: "dm", peerId: user.id });
              return (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  onPress={() => openDm(user)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                >
                  <View style={styles.avatarWrap}>
                    <View
                      style={[styles.avatar, { backgroundColor: avatarColor(user.nickname) }]}
                    >
                      <Text style={styles.avatarText}>
                        {user.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.rowDot} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{user.nickname}</Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {lastDm
                        ? `${lastDm.sender_id === me?.id ? "Tú: " : ""}${lastDm.content}`
                        : "Toca para iniciar un chat"}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowTime}>{formatTime(lastDm?.timestamp)}</Text>
                    {dmUnread > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {dmUnread > 99 ? "99+" : dmUnread}
                        </Text>
                      </View>
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
