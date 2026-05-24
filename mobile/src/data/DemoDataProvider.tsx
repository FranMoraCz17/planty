import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User as FirebaseAuthUser } from "firebase/auth";
import { auth } from "@/src/firebase/firebaseConfig";
import {
  createPlant as createPlantInFirestore,
  deletePlantById,
  getPlantsByUser as getPlantsByUserFromFirestore,
  type PlantDocument,
  updatePlantById,
} from "@/src/services/plantService";
import {
  ensureUserDocument,
  getUserById,
  type UserDocument,
  updateUserById,
} from "@/src/services/userService";
import AreaService, {
  type AreaDocument,
  type CreateAreaInput,
  type UpdateAreaInput,
} from "@/src/services/areaService";

export type EditableUserFields = Pick<UserDocument, "name" | "username" | "email" | "city">;
export type EditablePlantFields = Pick<
  PlantDocument,
  "name" | "scientificName" | "locationName" | "wateringFrequencyLabel"
> & { photoUri?: string; areaId?: string | null };

interface UpdateOptions {
  simulateFailure?: boolean;
}

interface DemoDataContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  currentUserId: string;
  currentUser: UserDocument | null;
  users: UserDocument[];
  plants: PlantDocument[];
  areas: AreaDocument[];
  getPlantById: (id: string) => PlantDocument | null;
  getPlantsByUser: (userId: string) => PlantDocument[];
  getAreaById: (id: string) => AreaDocument | null;
  getPlantsByArea: (areaId: string) => PlantDocument[];
  updateUser: (
    id: string,
    data: EditableUserFields,
    options?: UpdateOptions,
  ) => Promise<UserDocument>;
  updatePlant: (
    id: string,
    data: EditablePlantFields,
    options?: UpdateOptions,
  ) => Promise<PlantDocument>;
  createPlant: (data: EditablePlantFields, options?: UpdateOptions) => Promise<PlantDocument>;
  deletePlant: (id: string, options?: UpdateOptions) => Promise<void>;
  createArea: (data: CreateAreaInput) => Promise<AreaDocument>;
  updateArea: (id: string, data: UpdateAreaInput) => Promise<AreaDocument>;
  deleteArea: (id: string) => Promise<void>;
  refreshAreas: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const DemoDataContext = createContext<DemoDataContextValue | undefined>(undefined);

const buildSamplePlants = (userId: string): Array<Omit<PlantDocument, "id">> => [
  {
    userId,
    name: "Monstera",
    scientificName: "Monstera deliciosa",
    locationName: "Sala norte",
    wateringFrequencyLabel: "Cada 5 dias",
    createdAt: new Date().toISOString(),
  },
  {
    userId,
    name: "Pothos",
    scientificName: "Epipremnum aureum",
    locationName: "Sala principal",
    wateringFrequencyLabel: "Cada 7 dias",
    createdAt: new Date().toISOString(),
  },
  {
    userId,
    name: "Sansevieria",
    scientificName: "Dracaena trifasciata",
    locationName: "Dormitorio",
    wateringFrequencyLabel: "Cada 12 dias",
    createdAt: new Date().toISOString(),
  },
  {
    userId,
    name: "Helecho",
    scientificName: "Nephrolepis exaltata",
    locationName: "Patio trasero",
    wateringFrequencyLabel: "Cada 3 dias",
    createdAt: new Date().toISOString(),
  },
];

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [plants, setPlants] = useState<PlantDocument[]>([]);
  const [areas, setAreas] = useState<AreaDocument[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isReady, setIsReady] = useState(false);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users],
  );

  const getPlantById = (id: string) => plants.find((plant) => plant.id === id) ?? null;

  const getPlantsByUser = (userId: string) => plants.filter((plant) => plant.userId === userId);

  const getAreaById = (id: string) => areas.find((area) => area.id === id) ?? null;

  const getPlantsByArea = (areaId: string) =>
    plants.filter((plant) => plant.areaId === areaId);

  useEffect(() => {
    let isMounted = true;

    const syncAuthUser = async (firebaseUser: FirebaseAuthUser | null) => {
      try {
        if (!firebaseUser) {
          if (!isMounted) {
            return;
          }

          setCurrentUserId("");
          setUsers([]);
          setPlants([]);
          setIsReady(true);
          return;
        }

        let userDocument = await getUserById(firebaseUser.uid);

        if (!userDocument) {
          userDocument = await ensureUserDocument({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Usuario",
            username: firebaseUser.email?.split("@")[0] ?? firebaseUser.uid.slice(0, 8),
            city: "Sin ciudad",
          });
        }

        let userPlants = await getPlantsByUserFromFirestore(firebaseUser.uid);

        if (userPlants.length === 0) {
          const samplePlants = buildSamplePlants(firebaseUser.uid);

          await Promise.all(
            samplePlants.map((plant) =>
              createPlantInFirestore({
                id: "",
                userId: plant.userId,
                name: plant.name,
                scientificName: plant.scientificName,
                locationName: plant.locationName,
                wateringFrequencyLabel: plant.wateringFrequencyLabel,
                createdAt: plant.createdAt,
              }),
            ),
          );

          userPlants = await getPlantsByUserFromFirestore(firebaseUser.uid);
        }

        const userAreas = await AreaService.getAreasByUser(firebaseUser.uid);

        if (!isMounted) {
          return;
        }

        setCurrentUserId(firebaseUser.uid);
        setUsers(userDocument ? [userDocument] : []);
        setPlants(userPlants);
        setAreas(userAreas);
        setIsReady(true);
      } catch (error) {
        console.error("Error syncing auth user:", error);

        if (!isMounted) {
          return;
        }

        setCurrentUserId("");
        setUsers([]);
        setPlants([]);
        setAreas([]);
        setIsReady(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsReady(false);
      void syncAuthUser(firebaseUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const updateUser = async (
    id: string,
    data: EditableUserFields,
    options?: UpdateOptions,
  ): Promise<UserDocument> => {
    void options;

    try {
      const updatedUser = await updateUserById(id, data);
      setUsers([updatedUser]);
      return updatedUser;
    } catch (error) {
      console.error("Error updating user in provider:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo actualizar el usuario.");
    }
  };

  const updatePlant = async (
    id: string,
    data: EditablePlantFields,
    options?: UpdateOptions,
  ): Promise<PlantDocument> => {
    void options;

    try {
      const updatedPlant = await updatePlantById(id, data);
      const refreshedPlants = currentUserId
        ? await getPlantsByUserFromFirestore(currentUserId)
        : [updatedPlant];
      setPlants(refreshedPlants);
      return updatedPlant;
    } catch (error) {
      console.error("Error updating plant in provider:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo actualizar la planta.");
    }
  };

  const createPlant = async (
    data: EditablePlantFields,
    options?: UpdateOptions,
  ): Promise<PlantDocument> => {
    void options;

    if (!currentUserId) {
      throw new Error("No hay un usuario autenticado para crear plantas.");
    }

    try {
      const createdPlantId = await createPlantInFirestore({
        id: "",
        userId: currentUserId,
        name: data.name,
        scientificName: data.scientificName,
        locationName: data.locationName,
        wateringFrequencyLabel: data.wateringFrequencyLabel,
        createdAt: new Date().toISOString(),
        photoUri: data.photoUri,
        areaId: data.areaId ?? null,
      });

      const refreshedPlants = await getPlantsByUserFromFirestore(currentUserId);
      setPlants(refreshedPlants);

      const createdPlant = refreshedPlants.find((plant) => plant.id === createdPlantId);

      if (!createdPlant) {
        throw new Error("La planta fue creada, pero no se pudo recargar.");
      }

      return createdPlant;
    } catch (error) {
      console.error("Error creating plant in provider:", error);
      throw error instanceof Error ? error : new Error("No se pudo crear la planta.");
    }
  };

  const deletePlant = async (id: string, options?: UpdateOptions): Promise<void> => {
    void options;

    try {
      await deletePlantById(id);
      const refreshedPlants = currentUserId ? await getPlantsByUserFromFirestore(currentUserId) : [];
      setPlants(refreshedPlants);
    } catch (error) {
      console.error("Error deleting plant in provider:", error);
      throw error instanceof Error ? error : new Error("No se pudo eliminar la planta.");
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUserId) return;
    try {
      const refreshed = await getUserById(currentUserId);
      if (refreshed) {
        setUsers((prev) => {
          const others = prev.filter((u) => u.id !== refreshed.id);
          return [...others, refreshed];
        });
      }
    } catch (error) {
      console.error("Error refreshing current user:", error);
    }
  };

  const refreshAreas = async () => {
    if (!currentUserId) return;
    try {
      const refreshed = await AreaService.getAreasByUser(currentUserId);
      setAreas(refreshed);
    } catch (error) {
      console.error("Error refreshing areas:", error);
    }
  };

  const createArea = async (data: CreateAreaInput): Promise<AreaDocument> => {
    const created = await AreaService.createArea(data);
    setAreas((prev) => [...prev, created]);
    return created;
  };

  const updateArea = async (
    id: string,
    data: UpdateAreaInput,
  ): Promise<AreaDocument> => {
    const updated = await AreaService.updateArea(id, data);
    setAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteArea = async (id: string): Promise<void> => {
    await AreaService.deleteArea(id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  if (!isReady) {
    return null;
  }

  return (
    <DemoDataContext.Provider
      value={{
        isReady,
        isAuthenticated: Boolean(currentUserId),
        currentUserId,
        currentUser,
        users,
        plants,
        areas,
        getAreaById,
        getPlantsByArea,
        createArea,
        updateArea,
        deleteArea,
        refreshAreas,
        getPlantById,
        getPlantsByUser,
        updateUser,
        updatePlant,
        createPlant,
        deletePlant,
        refreshCurrentUser,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);

  if (!context) {
    throw new Error("useDemoData must be used inside DemoDataProvider");
  }

  return context;
}
