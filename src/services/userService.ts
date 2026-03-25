import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/src/firebase/firebaseConfig";

const usersCollection = collection(db, "users");

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

export async function getUserById(id: string): Promise<UserDocument | null> {
  try {
    const userQuery = query(usersCollection, where("id", "==", id));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as UserDocument;
  } catch (error) {
    console.error("Error getting user by id:", error);
    throw new Error("No se pudo cargar el usuario.");
  }
}
