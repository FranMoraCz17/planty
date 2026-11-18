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
function initialPhoto(
  userPhotoUri?: string | null,
  scientificName?: string | null,
): string | null {
  if (userPhotoUri) return userPhotoUri;
  if (!scientificName) return null;
  // Si ya está en caché, evita el flash placeholder -> foto al re-montar
  // (ej. al reabrir el buscador o el calendario).
  const cached = PlantPhotoService.getCached(scientificName);
  return cached !== undefined ? cached : null;
}

export function usePlantPhoto({
  userPhotoUri,
  scientificName,
}: UsePlantPhotoOptions): UsePlantPhotoReturn {
  const [photoUri, setPhotoUri] = useState<string | null>(() =>
    initialPhoto(userPhotoUri, scientificName),
  );
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

    const cached = PlantPhotoService.getCached(scientificName);
    if (cached !== undefined) {
      setPhotoUri(cached);
      setIsLoading(false);
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
