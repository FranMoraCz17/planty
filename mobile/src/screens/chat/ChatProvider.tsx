import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDemoData } from "@/src/data/DemoDataProvider";
import ChatService, {
  type ChatMessage,
  type ChatSocket,
  type ChatUser,
  type SendMessageOptions,
} from "@/src/services/chatService";

export type ConnectionState = "connecting" | "online" | "offline";

// Identifica una conversación: el grupo general o un DM con un usuario.
export type ChatConversation =
  | { kind: "group" }
  | { kind: "dm"; peerId: string };

// Clave interna de conversación para mapas de estado.
function convKey(conversation: ChatConversation): string {
  return conversation.kind === "group" ? "group" : conversation.peerId;
}

interface ChatContextValue {
  connection: ConnectionState;
  error: string | null;
  me: ChatUser | null;
  onlineUsers: ChatUser[];
  groupMessages: ChatMessage[];
  getThread: (peerId: string) => ChatMessage[];
  typingNickname: (conversation: ChatConversation) => string | null;
  userById: (id: string) => ChatUser | undefined;
  seenIds: Set<string>;
  unreadCount: (conversation: ChatConversation) => number;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  markIncomingRead: (messages: ChatMessage[]) => void;
  sendGroup: (content: string, options?: SendMessageOptions) => void;
  sendDM: (peerId: string, content: string, options?: SendMessageOptions) => void;
  notifyTyping: (conversation: ChatConversation) => void;
  loadDmHistory: (peerId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Agrega un mensaje a una lista evitando duplicados por id.
function upsert(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (list.some((m) => m.id === message.id)) return list;
  return [...list, message];
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useDemoData();
  const nickname = currentUser?.username || currentUser?.name || "Invitado";

  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ChatUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [dmThreads, setDmThreads] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  // Ids de mis mensajes que el destinatario ya vio (doble check).
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  // No leídos por conversación ("group" o peerId).
  const [unread, setUnread] = useState<Record<string, number>>({});

  const socketRef = useRef<ChatSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const myIdRef = useRef<string | null>(null);
  // Conversación abierta ahora mismo: sus mensajes nuevos no cuentan como no leídos.
  const activeConvRef = useRef<string | null>(null);
  // Ids ya marcados como leídos para no repetir el evento mark_read.
  const readSentRef = useRef<Set<string>>(new Set());
  // Timers para limpiar el indicador "escribiendo" de cada usuario.
  const clearTypingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Timers para dejar de enviar "escribiendo" propio por conversación.
  const stopTypingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Conecta una sola vez al montar (al entrar a la sección de mensajería).
  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        setConnection("connecting");
        setError(null);
        const { user, token } = await ChatService.join(nickname);
        if (cancelled) return;
        setMe(user);
        myIdRef.current = user.id;
        tokenRef.current = token;

        const socket = ChatService.connect(token, {
          onOpen: () => !cancelled && setConnection("online"),
          onClose: () => !cancelled && setConnection("offline"),
          onError: () => !cancelled && setConnection("offline"),
          onEvent: (event) => {
            if (cancelled) return;
            switch (event.type) {
              case "group_history":
                setGroupMessages(event.messages);
                break;
              case "group_message":
                setGroupMessages((prev) => upsert(prev, event.message));
                if (
                  event.message.sender_id !== myIdRef.current &&
                  activeConvRef.current !== "group"
                ) {
                  setUnread((prev) => ({
                    ...prev,
                    group: (prev.group ?? 0) + 1,
                  }));
                }
                break;
              case "dm": {
                const msg = event.message;
                const peer =
                  msg.sender_id === myIdRef.current
                    ? msg.recipient_id ?? ""
                    : msg.sender_id;
                if (!peer) break;
                setDmThreads((prev) => ({
                  ...prev,
                  [peer]: upsert(prev[peer] ?? [], msg),
                }));
                if (
                  msg.sender_id !== myIdRef.current &&
                  activeConvRef.current !== peer
                ) {
                  setUnread((prev) => ({
                    ...prev,
                    [peer]: (prev[peer] ?? 0) + 1,
                  }));
                }
                break;
              }
              case "message_seen":
                setSeenIds((prev) => {
                  const next = new Set(prev);
                  next.add(event.message_id);
                  return next;
                });
                break;
              case "message_expired":
                // Mensaje temporal vencido: desaparece de todas las listas.
                setGroupMessages((prev) =>
                  prev.filter((m) => m.id !== event.message_id),
                );
                setDmThreads((prev) => {
                  const next: Record<string, ChatMessage[]> = {};
                  for (const [peer, list] of Object.entries(prev)) {
                    next[peer] = list.filter((m) => m.id !== event.message_id);
                  }
                  return next;
                });
                break;
              case "users_list":
                setOnlineUsers(event.users);
                break;
              case "user_joined":
                setOnlineUsers((prev) =>
                  prev.some((u) => u.id === event.user.id)
                    ? prev
                    : [...prev, event.user],
                );
                break;
              case "user_left":
                setOnlineUsers((prev) =>
                  prev.filter((u) => u.id !== event.user_id),
                );
                break;
              case "typing": {
                if (event.user_id === myIdRef.current) break;
                setTypingUsers((prev) => ({
                  ...prev,
                  [event.user_id]: event.nickname,
                }));
                const timers = clearTypingTimers.current;
                if (timers[event.user_id]) clearTimeout(timers[event.user_id]);
                timers[event.user_id] = setTimeout(() => {
                  setTypingUsers((prev) => {
                    const next = { ...prev };
                    delete next[event.user_id];
                    return next;
                  });
                }, 3500);
                break;
              }
              case "stop_typing":
                setTypingUsers((prev) => {
                  const next = { ...prev };
                  delete next[event.user_id];
                  return next;
                });
                break;
              case "error":
                setError(event.message);
                break;
              default:
                break;
            }
          },
        });
        socketRef.current = socket;
      } catch (err) {
        if (cancelled) return;
        setConnection("offline");
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo conectar al chat. Intenta de nuevo.",
        );
      }
    }

    void start();

    // Copiamos los refs a variables locales para el cleanup (evita leer
    // .current desfasado cuando React ejecuta la limpieza).
    const clearTimers = clearTypingTimers.current;
    const stopTimers = stopTypingTimers.current;
    return () => {
      cancelled = true;
      Object.values(clearTimers).forEach(clearTimeout);
      Object.values(stopTimers).forEach(clearTimeout);
      socketRef.current?.close();
    };
  }, [nickname]);

  const getThread = useCallback(
    (peerId: string) => dmThreads[peerId] ?? [],
    [dmThreads],
  );

  const userById = useCallback(
    (id: string) => onlineUsers.find((u) => u.id === id),
    [onlineUsers],
  );

  const typingNickname = useCallback(
    (conversation: ChatConversation): string | null => {
      const entries = Object.entries(typingUsers);
      if (conversation.kind === "group") {
        return entries.length > 0 ? entries[0][1] : null;
      }
      return typingUsers[conversation.peerId] ?? null;
    },
    [typingUsers],
  );

  const unreadCount = useCallback(
    (conversation: ChatConversation) => unread[convKey(conversation)] ?? 0,
    [unread],
  );

  // La pantalla de conversación avisa cuál hilo está abierto; al abrirlo
  // se limpia su contador de no leídos.
  const setActiveConversation = useCallback(
    (conversation: ChatConversation | null) => {
      const key = conversation ? convKey(conversation) : null;
      activeConvRef.current = key;
      if (key) {
        setUnread((prev) => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [],
  );

  // Notifica al remitente que sus mensajes fueron vistos (doble check).
  // Solo aplica a mensajes ajenos que permiten confirmación de lectura.
  const markIncomingRead = useCallback((messages: ChatMessage[]) => {
    const socket = socketRef.current;
    if (!socket) return;
    for (const msg of messages) {
      if (msg.sender_id === myIdRef.current) continue;
      if (msg.allow_read_receipt === false) continue;
      if (readSentRef.current.has(msg.id)) continue;
      readSentRef.current.add(msg.id);
      socket.sendMarkRead(msg.id);
    }
  }, []);

  const sendGroup = useCallback(
    (content: string, options?: SendMessageOptions) => {
      socketRef.current?.sendGroupMessage(content, options);
      socketRef.current?.sendStopTyping();
    },
    [],
  );

  const sendDM = useCallback(
    (peerId: string, content: string, options?: SendMessageOptions) => {
      socketRef.current?.sendDM(peerId, content, options);
      socketRef.current?.sendStopTyping(peerId);
    },
    [],
  );

  // Envía "escribiendo" y programa el "stop" automático tras la inactividad.
  const notifyTyping = useCallback((conversation: ChatConversation) => {
    const to = conversation.kind === "dm" ? conversation.peerId : undefined;
    const key = convKey(conversation);
    socketRef.current?.sendTyping(to);
    const timers = stopTypingTimers.current;
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      socketRef.current?.sendStopTyping(to);
    }, 1500);
  }, []);

  const loadDmHistory = useCallback((peerId: string) => {
    const token = tokenRef.current;
    if (!token) return;
    ChatService.getDmHistory(token, peerId)
      .then((history) => {
        setDmThreads((prev) => {
          const live = prev[peerId] ?? [];
          // El historial es la base; agregamos los mensajes en vivo que no estén.
          const merged = live.reduce(upsert, history);
          return { ...prev, [peerId]: merged };
        });
      })
      .catch(() => {
        // si falla, dejamos lo que haya llegado por el WebSocket
      });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      connection,
      error,
      me,
      onlineUsers,
      groupMessages,
      getThread,
      typingNickname,
      userById,
      seenIds,
      unreadCount,
      setActiveConversation,
      markIncomingRead,
      sendGroup,
      sendDM,
      notifyTyping,
      loadDmHistory,
    }),
    [
      connection,
      error,
      me,
      onlineUsers,
      groupMessages,
      getThread,
      typingNickname,
      userById,
      seenIds,
      unreadCount,
      setActiveConversation,
      markIncomingRead,
      sendGroup,
      sendDM,
      notifyTyping,
      loadDmHistory,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat debe usarse dentro de un ChatProvider.");
  }
  return ctx;
}
