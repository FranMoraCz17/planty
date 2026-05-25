import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/src/firebase/firebaseConfig";

export interface UserDocument {
  id: string;
  name: string;
  username: string;
  email: string;
  city: string;
  avatarUrl: string | null;
  collectionCount: number;
  pendingCount: number;
  streakDays: number;
  createdAt: string;
}

interface FirestoreUserDocument {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  city?: string;
  avatarUrl?: string | null;
  collectionCount?: number;
  pendingCount?: number;
  streakDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateUserInput = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  city?: string | null;
};

export type UpdateUserInput = Pick<UserDocument, "name" | "username" | "email" | "city">;

const buildFallbackEmail = (id: string) => `usuario.${id.slice(0, 8)}@planty.app`;

const buildFallbackUsername = (id: string, email?: string) => {
  const fromEmail = email?.split("@")[0]?.trim();

  if (fromEmail) {
    return fromEmail;
  }

  return `usuario.${id.slice(0, 8)}`;
};

const mapUserDocument = (id: string, raw: FirestoreUserDocument): UserDocument => {
  const resolvedEmail = raw.email?.trim() || buildFallbackEmail(id);

  return {
    id,
    name: raw.name?.trim() || "Usuario Planty",
    username: raw.username?.trim() || buildFallbackUsername(id, resolvedEmail),
    email: resolvedEmail,
    city: raw.city?.trim() || "Sin ciudad",
    avatarUrl: raw.avatarUrl ?? null,
    collectionCount: raw.collectionCount ?? 0,
    pendingCount: raw.pendingCount ?? 0,
    streakDays: raw.streakDays ?? 0,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
};

export async function getUserById(id: string): Promise<UserDocument | null> {
  try {
    const userRef = doc(db, "users", id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapUserDocument(snapshot.id, snapshot.data() as FirestoreUserDocument);
  } catch (error) {
    console.error("Error getting user by id:", error);
    throw new Error("No se pudo cargar el usuario.");
  }
}

export async function ensureUserDocument({
  id,
  displayName,
  email,
  name,
  username,
  city,
}: CreateUserInput): Promise<UserDocument> {
  try {
    const existingUser = await getUserById(id);

    if (existingUser) {
      return existingUser;
    }

    const userRef = doc(db, "users", id);
    const fallbackEmail = email?.trim() || buildFallbackEmail(id);

    const payload: FirestoreUserDocument = {
      id,
      name: name?.trim() || displayName?.trim() || "Usuario Planty",
      username: username?.trim() || buildFallbackUsername(id, fallbackEmail),
      email: fallbackEmail,
      city: city?.trim() || "Sin ciudad",
      avatarUrl: null,
      collectionCount: 0,
      pendingCount: 0,
      streakDays: 0,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, payload);

    return mapUserDocument(id, payload);
  } catch (error) {
    console.error("Error ensuring user document:", error);
    throw new Error("No se pudo preparar el usuario en Firestore.");
  }
}

export async function updateAvatarUrl(
  id: string,
  avatarUrl: string | null,
): Promise<UserDocument> {
  try {
    const userRef = doc(db, "users", id);

    await updateDoc(userRef, {
      avatarUrl,
      updatedAt: new Date().toISOString(),
    });

    const updatedUser = await getUserById(id);

    if (!updatedUser) {
      throw new Error("El avatar fue actualizado, pero no se pudo recargar el usuario.");
    }

    return updatedUser;
  } catch (error) {
    console.error("Error updating avatar url:", error);
    throw new Error("No se pudo actualizar la foto en Firestore.");
  }
}

export async function updateUserById(id: string, data: UpdateUserInput): Promise<UserDocument> {
  try {
    const userRef = doc(db, "users", id);

    await updateDoc(userRef, {
      id,
      name: data.name,
      username: data.username,
      email: data.email,
      city: data.city,
      updatedAt: new Date().toISOString(),
    });

    const updatedUser = await getUserById(id);

    if (!updatedUser) {
      throw new Error("El usuario fue actualizado, pero no se pudo recargar.");
    }

    return updatedUser;
  } catch (error) {
    console.error("Error updating user by id:", error);
    throw new Error("No se pudo actualizar el usuario en Firestore.");
  }
}
