/**
 * Provee info ampliada de una especie a partir del nombre cientifico:
 * - Foto en alta calidad
 * - Extracto de descripcion (Wikipedia REST API summary endpoint)
 * - URL a Wikipedia para "leer mas"
 *
 * Cachea en memoria por nombre cientifico para evitar requests duplicados.
 */

export interface SpeciesInfo {
  scientificName: string;
  photoUri: string | null;
  thumbnailUri: string | null;
  extract: string | null;
  wikipediaUrl: string | null;
}

const WIKI_BASE_ES =
  "https://es.wikipedia.org/api/rest_v1/page/summary/";
const WIKI_BASE_EN =
  "https://en.wikipedia.org/api/rest_v1/page/summary/";

const cache = new Map<string, SpeciesInfo>();

function normalizeName(scientificName: string): string {
  return scientificName.trim().replace(/\s+/g, "_");
}

interface WikipediaSummary {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  extract?: string;
  content_urls?: {
    desktop?: { page?: string };
    mobile?: { page?: string };
  };
}

async function fetchSummary(
  baseUrl: string,
  scientificName: string,
): Promise<WikipediaSummary | null> {
  try {
    const url = `${baseUrl}${encodeURIComponent(normalizeName(scientificName))}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PlantyApp/1.0 (educational project)",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as WikipediaSummary;
  } catch {
    return null;
  }
}

const SpeciesInfoService = {
  async fetchInfo(scientificName: string): Promise<SpeciesInfo> {
    if (!scientificName?.trim()) {
      return {
        scientificName: "",
        photoUri: null,
        thumbnailUri: null,
        extract: null,
        wikipediaUrl: null,
      };
    }

    const key = scientificName.toLowerCase().trim();
    if (cache.has(key)) {
      return cache.get(key) as SpeciesInfo;
    }

    // Primero intenta en espanol, despues en ingles como fallback
    let summary = await fetchSummary(WIKI_BASE_ES, scientificName);
    if (!summary || !summary.extract) {
      const enSummary = await fetchSummary(WIKI_BASE_EN, scientificName);
      if (enSummary) {
        // Si tenemos espanol pero sin extract, mantenemos espanol y solo
        // tomamos extract de ingles. Caso comun para especies poco populares.
        if (summary) {
          summary = { ...summary, extract: enSummary.extract };
        } else {
          summary = enSummary;
        }
      }
    }

    const info: SpeciesInfo = {
      scientificName,
      photoUri: summary?.originalimage?.source ?? null,
      thumbnailUri: summary?.thumbnail?.source ?? null,
      extract: summary?.extract ?? null,
      wikipediaUrl:
        summary?.content_urls?.mobile?.page ??
        summary?.content_urls?.desktop?.page ??
        null,
    };

    cache.set(key, info);
    return info;
  },

  clearCache(): void {
    cache.clear();
  },
};

export default SpeciesInfoService;
