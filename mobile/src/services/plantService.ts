import { db } from "@/src/firebase/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const plantsCollection = collection(db, "plants");

export interface PlantDocument {
  id: string;
  userId: string;
  name: string;
  scientificName: string;
  locationName: string;
  wateringFrequencyLabel: string;
  createdAt: string;
  photoUri?: string;
  areaId?: string | null;
  notes?: string;
  acquiredAt?: string | null;
}

export type CreatePlantInput = PlantDocument;
export type UpdatePlantInput = Pick<
  PlantDocument,
  "name" | "scientificName" | "locationName" | "wateringFrequencyLabel"
> & {
  photoUri?: string;
  areaId?: string | null;
  notes?: string;
  acquiredAt?: string | null;
};

interface FirestorePlantDocument {
  id?: string;
  userId?: string;
  name?: string;
  species?: string;
  location?: string;
  scientificName?: string;
  locationName?: string;
  wateringFrequencyLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  photoUri?: string;
  areaId?: string | null;
  notes?: string;
  acquiredAt?: string | null;
}

const mapPlantDocument = (id: string, raw: FirestorePlantDocument): PlantDocument => ({
  id,
  userId: raw.userId ?? "",
  name: raw.name?.trim() || "Planta sin nombre",
  scientificName: raw.scientificName?.trim() || raw.species?.trim() || "Especie sin definir",
  locationName: raw.locationName?.trim() || raw.location?.trim() || "Ubicacion sin definir",
  wateringFrequencyLabel: raw.wateringFrequencyLabel?.trim() || "Cada 7 dias",
  createdAt: raw.createdAt ?? new Date().toISOString(),
  photoUri: raw.photoUri,
  areaId: raw.areaId ?? null,
  notes: raw.notes ?? "",
  acquiredAt: raw.acquiredAt ?? null,
});

export async function getPlantsByUser(
  userId: string,
): Promise<PlantDocument[]> {
  try {
    const plantsQuery = query(plantsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(plantsQuery);

    return snapshot.docs.map((item) =>
      mapPlantDocument(item.id, item.data() as FirestorePlantDocument),
    );
  } catch (error) {
    console.error("Error getting plants by user:", error);
    throw new Error("No se pudieron cargar las plantas del usuario.");
  }
}

export async function getPlantById(id: string): Promise<PlantDocument | null> {
  try {
    const plantRef = doc(db, "plants", id);
    const snapshot = await getDoc(plantRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapPlantDocument(snapshot.id, snapshot.data() as FirestorePlantDocument);
  } catch (error) {
    console.error("Error getting plant by id:", error);
    throw new Error("No se pudo cargar la planta.");
  }
}

export async function createPlant(data: CreatePlantInput): Promise<string> {
  try {
    const plantRef = doc(plantsCollection);

    await setDoc(plantRef, {
      id: plantRef.id,
      userId: data.userId,
      name: data.name,
      species: data.scientificName,
      scientificName: data.scientificName,
      location: data.locationName,
      locationName: data.locationName,
      wateringFrequencyLabel: data.wateringFrequencyLabel,
      createdAt: data.createdAt || new Date().toISOString(),
      ...(data.photoUri ? { photoUri: data.photoUri } : {}),
      ...(data.areaId ? { areaId: data.areaId } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.acquiredAt !== undefined
        ? { acquiredAt: data.acquiredAt }
        : {}),
    });

    return plantRef.id;
  } catch (error) {
    console.error("Error creating plant:", error);
    throw new Error("No se pudo crear la planta.");
  }
}

export async function deletePlantById(id: string): Promise<void> {
  try {
    const plantRef = doc(db, "plants", id);
    await deleteDoc(plantRef);
  } catch (error) {
    console.error("Error deleting plant by id:", error);
    throw new Error("No se pudo eliminar la planta.");
  }
}

export async function updatePlantById(
  id: string,
  data: UpdatePlantInput,
): Promise<PlantDocument> {
  try {
    const plantRef = doc(db, "plants", id);

    await updateDoc(plantRef, {
      name: data.name,
      species: data.scientificName,
      scientificName: data.scientificName,
      location: data.locationName,
      locationName: data.locationName,
      wateringFrequencyLabel: data.wateringFrequencyLabel,
      updatedAt: new Date().toISOString(),
      ...(data.photoUri !== undefined ? { photoUri: data.photoUri } : {}),
      ...(data.areaId !== undefined ? { areaId: data.areaId } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.acquiredAt !== undefined
        ? { acquiredAt: data.acquiredAt }
        : {}),
    });

    const updatedPlant = await getPlantById(id);

    if (!updatedPlant) {
      throw new Error("La planta fue actualizada, pero no se pudo recargar.");
    }

    return updatedPlant;
  } catch (error) {
    console.error("Error updating plant by id:", error);
    throw new Error("No se pudo actualizar la planta en Firestore.");
  }
}
