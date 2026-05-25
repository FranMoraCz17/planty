import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import StorageService from "@/src/services/storageService";

interface UseAreaPhotoOptions {
  userId: string;
  areaId: string;
  onUploaded?: (newUrl: string) => void;
}

interface UseAreaPhotoReturn {
  isUploading: boolean;
  error: string | null;
  pickAndUpload: () => Promise<void>;
  resetError: () => void;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

async function pickFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos permiso para acceder a tu galeria.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  return result.assets[0].uri;
}

async function pickFromCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitamos permiso para usar la camara.");
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  return result.assets[0].uri;
}

async function compressImage(uri: string): Promise<string> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG },
  );
  return manipulated.uri;
}

function promptSource(): Promise<"library" | "camera" | null> {
  return new Promise((resolve) => {
    Alert.alert(
      "Foto del area",
      "Elegi de donde quieres tomar la foto",
      [
        { text: "Galeria", onPress: () => resolve("library") },
        { text: "Camara", onPress: () => resolve("camera") },
        { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

export function useAreaPhoto({
  userId,
  areaId,
  onUploaded,
}: UseAreaPhotoOptions): UseAreaPhotoReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    setError(null);
    try {
      const source = await promptSource();
      if (!source) return;

      const localUri =
        source === "library" ? await pickFromLibrary() : await pickFromCamera();
      if (!localUri) return;

      setIsUploading(true);
      const compressedUri = await compressImage(localUri);
      const downloadUrl = await StorageService.uploadAreaPhoto(
        userId,
        areaId,
        compressedUri,
      );
      onUploaded?.(downloadUrl);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la foto del area.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [userId, areaId, onUploaded]);

  const resetError = useCallback(() => setError(null), []);

  return { isUploading, error, pickAndUpload, resetError };
}
