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

const areasCollection = collection(db, "areas");

/**
 * Un "Area" representa un espacio fisico donde el usuario tiene plantas.
 * Ejemplos: "Sala con luz indirecta", "Patio trasero", "Invernadero 1",
 * "Cafetal lote A". Soporta tanto uso domestico como agricola.
 */
export interface AreaDocument {
  id: string;
  userId: string;
  name: string;
  description: string;
  photoUri: string | null;
  lightLevel: AreaLightLevel;
  humidityLevel: AreaHumidityLevel;
  indoor: boolean;
  type: AreaType;
  zone: string;
  locationLat?: number;
  locationLng?: number;
  areaSizeM2?: number;
  createdAt: string;
}

export type AreaLightLevel =
  | "sombra"
  | "luz-indirecta"
  | "luz-brillante"
  | "sol-directo";

export type AreaHumidityLevel = "baja" | "media" | "alta";

export type AreaType =
  | "casa"
  | "patio"
  | "finca"
  | "invernadero"
  | "balcon"
  | "vivero"
  | "huerto"
  | "otro";

export type CreateAreaInput = Omit<AreaDocument, "id" | "createdAt">;
export type UpdateAreaInput = Partial<
  Pick<
    AreaDocument,
    | "name"
    | "description"
    | "photoUri"
    | "lightLevel"
    | "humidityLevel"
    | "indoor"
    | "type"
    | "zone"
    | "locationLat"
    | "locationLng"
    | "areaSizeM2"
  >
>;

interface FirestoreAreaDocument {
  userId?: string;
  name?: string;
  description?: string;
  photoUri?: string | null;
  lightLevel?: string;
  humidityLevel?: string;
  indoor?: boolean;
  type?: string;
  zone?: string;
  locationLat?: number;
  locationLng?: number;
  areaSizeM2?: number;
  createdAt?: string;
  updatedAt?: string;
}

function normalizeLight(value: string | undefined): AreaLightLevel {
  switch (value) {
    case "sombra":
    case "luz-indirecta":
    case "luz-brillante":
    case "sol-directo":
      return value;
    default:
      return "luz-indirecta";
  }
}

function normalizeHumidity(value: string | undefined): AreaHumidityLevel {
  switch (value) {
    case "baja":
    case "media":
    case "alta":
      return value;
    default:
      return "media";
  }
}

function normalizeType(value: string | undefined): AreaType {
  switch (value) {
    case "casa":
    case "patio":
    case "finca":
    case "invernadero":
    case "balcon":
    case "vivero":
    case "huerto":
    case "otro":
      return value;
    default:
      return "casa";
  }
}

const mapDocument = (id: string, raw: FirestoreAreaDocument): AreaDocument => ({
  id,
  userId: raw.userId ?? "",
  name: raw.name?.trim() || "Area sin nombre",
  description: raw.description?.trim() || "",
  photoUri: raw.photoUri ?? null,
  lightLevel: normalizeLight(raw.lightLevel),
  humidityLevel: normalizeHumidity(raw.humidityLevel),
  indoor: Boolean(raw.indoor ?? true),
  type: normalizeType(raw.type),
  zone: raw.zone?.trim() ?? "",
  locationLat: raw.locationLat,
  locationLng: raw.locationLng,
  areaSizeM2: raw.areaSizeM2,
  createdAt: raw.createdAt ?? new Date().toISOString(),
});

const AreaService = {
  async getAreasByUser(userId: string): Promise<AreaDocument[]> {
    try {
      const q = query(areasCollection, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) =>
        mapDocument(d.id, d.data() as FirestoreAreaDocument),
      );
    } catch (error) {
      console.error("Error getting areas by user:", error);
      throw new Error("No se pudieron cargar las areas.");
    }
  },

  async getAreaById(id: string): Promise<AreaDocument | null> {
    try {
      const ref = doc(db, "areas", id);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return mapDocument(snapshot.id, snapshot.data() as FirestoreAreaDocument);
    } catch (error) {
      console.error("Error getting area by id:", error);
      throw new Error("No se pudo cargar el area.");
    }
  },

  async createArea(input: CreateAreaInput): Promise<AreaDocument> {
    try {
      const ref = doc(areasCollection);
      const payload: FirestoreAreaDocument = {
        userId: input.userId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        photoUri: input.photoUri ?? null,
        lightLevel: input.lightLevel,
        humidityLevel: input.humidityLevel,
        indoor: input.indoor,
        type: input.type,
        zone: input.zone?.trim() ?? "",
        locationLat: input.locationLat,
        locationLng: input.locationLng,
        areaSizeM2: input.areaSizeM2,
        createdAt: new Date().toISOString(),
      };
      await setDoc(ref, payload);
      return mapDocument(ref.id, payload);
    } catch (error) {
      console.error("Error creating area:", error);
      throw new Error("No se pudo crear el area.");
    }
  },

  async updateArea(id: string, input: UpdateAreaInput): Promise<AreaDocument> {
    try {
      const ref = doc(db, "areas", id);
      await updateDoc(ref, {
        ...input,
        updatedAt: new Date().toISOString(),
      });
      const updated = await AreaService.getAreaById(id);
      if (!updated) {
        throw new Error("El area fue actualizada pero no se pudo recargar.");
      }
      return updated;
    } catch (error) {
      console.error("Error updating area:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo actualizar el area.");
    }
  },

  async deleteArea(id: string): Promise<void> {
    try {
      const ref = doc(db, "areas", id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("Error deleting area:", error);
      throw new Error("No se pudo eliminar el area.");
    }
  },
};

export default AreaService;
