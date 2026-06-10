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
} from "@/src/services/chatService";

export type ConnectionState = "connecting" | "online" | "offline";

// Identifica una conversación: el grupo general o un DM con un usuario.
export type ChatConversation =
  | { kind: "group" }
  | { kind: "dm"; peerId: string };

interface ChatContextValue {
  connection: ConnectionState;
  error: string | null;
  me: ChatUser | null;
  onlineUsers: ChatUser[];
  groupMessages: ChatMessage[];
  getThread: (peerId: string) => ChatMessage[];
  typingNickname: (conversation: ChatConversation) => string | null;
  userById: (id: string) => ChatUser | undefined;
  sendGroup: (content: string) => void;
  sendDM: (peerId: string, content: string) => void;
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

  const socketRef = useRef<ChatSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const myIdRef = useRef<string | null>(null);
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
                break;
              }
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

  const sendGroup = useCallback((content: string) => {
    socketRef.current?.sendGroupMessage(content);
    socketRef.current?.sendStopTyping();
  }, []);

  const sendDM = useCallback((peerId: string, content: string) => {
    socketRef.current?.sendDM(peerId, content);
    socketRef.current?.sendStopTyping(peerId);
  }, []);

  // Envía "escribiendo" y programa el "stop" automático tras la inactividad.
  const notifyTyping = useCallback((conversation: ChatConversation) => {
    const to = conversation.kind === "dm" ? conversation.peerId : undefined;
    const key = to ?? "group";
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
