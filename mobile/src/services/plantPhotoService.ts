/**
 * Resuelve una foto representativa de una planta.
 *
 * Cascada:
 *  1. Si hay foto del usuario asociada (PlantDocument.photoUri), usarla.
 *  2. Si no, consultar Wikipedia REST API por scientificName -> thumbnail.
 *  3. Si no hay match, devolver null y la UI usa icono generico.
 *
 * Cachea en memoria por nombre cientifico para evitar requests duplicados.
 */

const WIKI_BASE =
  "https://es.wikipedia.org/api/rest_v1/page/summary/";

const cache = new Map<string, string | null>();

function normalizeName(scientificName: string): string {
  return scientificName.trim().replace(/\s+/g, "_");
}

const PlantPhotoService = {
  async fetchSpeciesPhoto(scientificName: string): Promise<string | null> {
    if (!scientificName?.trim()) return null;

    const key = scientificName.toLowerCase().trim();
    if (cache.has(key)) {
      return cache.get(key) ?? null;
    }

    try {
      const url = `${WIKI_BASE}${encodeURIComponent(normalizeName(scientificName))}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PlantyApp/1.0 (educational project)",
        },
      });
      if (!response.ok) {
        cache.set(key, null);
        return null;
      }
      const data = (await response.json()) as {
        thumbnail?: { source?: string };
        originalimage?: { source?: string };
      };
      const photo =
        data.originalimage?.source || data.thumbnail?.source || null;
      cache.set(key, photo);
      return photo;
    } catch {
      cache.set(key, null);
      return null;
    }
  },

  // Util para limpiar cache si en algun punto el usuario cambia idioma o data fresca
  clearCache(): void {
    cache.clear();
  },
};

export default PlantPhotoService;
