import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { app } from "@/src/firebase/firebaseConfig";

const storage = getStorage(app);

const StorageService = {
  /**
   * Sube la foto de perfil del usuario y devuelve la URL publica.
   * Sobrescribe la foto anterior (un solo archivo por usuario).
   */
  async uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();

      const photoRef = ref(storage, `users/${userId}/profile.jpg`);
      await uploadBytes(photoRef, blob, {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=3600",
      });

      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo subir la foto al servidor.");
    }
  },

  /**
   * Sube la foto de un area del usuario y devuelve la URL publica.
   */
  async uploadAreaPhoto(
    userId: string,
    areaId: string,
    localUri: string,
  ): Promise<string> {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const photoRef = ref(
        storage,
        `users/${userId}/areas/${areaId}.jpg`,
      );
      await uploadBytes(photoRef, blob, {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=3600",
      });
      return await getDownloadURL(photoRef);
    } catch (error) {
      console.error("Error uploading area photo:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo subir la foto del area.");
    }
  },

  /**
   * Elimina la foto de un area (silenciosamente si no existe).
   */
  async deleteAreaPhoto(userId: string, areaId: string): Promise<void> {
    try {
      const photoRef = ref(
        storage,
        `users/${userId}/areas/${areaId}.jpg`,
      );
      await deleteObject(photoRef);
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code === "storage/object-not-found") return;
      console.error("Error deleting area photo:", error);
    }
  },

  /**
   * Elimina la foto de perfil del usuario (si existe).
   */
  async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      const photoRef = ref(storage, `users/${userId}/profile.jpg`);
      await deleteObject(photoRef);
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code === "storage/object-not-found") {
        return;
      }
      console.error("Error deleting profile photo:", error);
      throw error instanceof Error
        ? error
        : new Error("No se pudo eliminar la foto del servidor.");
    }
  },
};

export default StorageService;
