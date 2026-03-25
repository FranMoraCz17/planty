import { db } from "@/src/firebase/firebaseConfig";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

const plantsCollection = collection(db, "plants");

export interface PlantDocument {
  id: string;
  userId: string;
  name: string;
  scientificName: string;
  locationName: string;
  wateringFrequencyLabel: string;
  createdAt: string;
}

export type CreatePlantInput = PlantDocument;

export async function getPlantsByUser(
  userId: string,
): Promise<PlantDocument[]> {
  try {
    const plantsQuery = query(plantsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(plantsQuery);

    return snapshot.docs.map((doc) => doc.data() as PlantDocument);
  } catch (error) {
    console.error("Error getting plants by user:", error);
    throw new Error("No se pudieron cargar las plantas del usuario.");
  }
}

export async function getPlantById(id: string): Promise<PlantDocument | null> {
  try {
    const plantQuery = query(plantsCollection, where("id", "==", id));
    const snapshot = await getDocs(plantQuery);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as PlantDocument;
  } catch (error) {
    console.error("Error getting plant by id:", error);
    throw new Error("No se pudo cargar la planta.");
  }
}

export async function createPlant(data: CreatePlantInput): Promise<string> {
  try {
    const docRef = await addDoc(plantsCollection, data);
    return docRef.id;
  } catch (error) {
    console.error("Error creating plant:", error);
    throw new Error("No se pudo crear la planta.");
  }
}
