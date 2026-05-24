import { useEffect, useState } from "react";
import PlantPhotoService from "@/src/services/plantPhotoService";

interface UsePlantPhotoReturn {
  photoUri: string | null;
  isLoading: boolean;
}

interface UsePlantPhotoOptions {
  userPhotoUri?: string | null;
  scientificName?: string | null;
}

/**
 * Resuelve la foto de una planta en cascada:
 * 1. userPhotoUri (si existe)
 * 2. Wikipedia por scientificName
 * 3. null (UI muestra icono generico)
 */
export function usePlantPhoto({
  userPhotoUri,
  scientificName,
}: UsePlantPhotoOptions): UsePlantPhotoReturn {
  const initial = userPhotoUri ?? null;
  const [photoUri, setPhotoUri] = useState<string | null>(initial);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userPhotoUri) {
      setPhotoUri(userPhotoUri);
      setIsLoading(false);
      return;
    }
    if (!scientificName) {
      setPhotoUri(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void PlantPhotoService.fetchSpeciesPhoto(scientificName)
      .then((url) => {
        if (cancelled) return;
        setPhotoUri(url);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userPhotoUri, scientificName]);

  return { photoUri, isLoading };
}
