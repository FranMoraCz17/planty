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
// Requests en vuelo, para no disparar el mismo fetch dos veces si varios
// componentes piden la misma especie al mismo tiempo (ej. buscador + calendario).
const pending = new Map<string, Promise<string | null>>();

function normalizeName(scientificName: string): string {
  return scientificName.trim().replace(/\s+/g, "_");
}

function cacheKey(scientificName: string): string {
  return scientificName.toLowerCase().trim();
}

const PlantPhotoService = {
  /**
   * Devuelve el valor cacheado de forma sincrónica, sin disparar un fetch.
   * `undefined` = todavía no se consultó esta especie.
   * `null` = ya se consultó y no hay foto disponible.
   */
  getCached(scientificName: string): string | null | undefined {
    if (!scientificName?.trim()) return null;
    return cache.get(cacheKey(scientificName));
  },

  async fetchSpeciesPhoto(scientificName: string): Promise<string | null> {
    if (!scientificName?.trim()) return null;

    const key = cacheKey(scientificName);
    if (cache.has(key)) {
      return cache.get(key) ?? null;
    }
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;

    const request = (async () => {
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
      } finally {
        pending.delete(key);
      }
    })();

    pending.set(key, request);
    return request;
  },

  // Util para limpiar cache si en algun punto el usuario cambia idioma o data fresca
  clearCache(): void {
    cache.clear();
    pending.clear();
  },
};

export default PlantPhotoService;
