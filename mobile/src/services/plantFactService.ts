/**
 * Obtiene un dato curioso ("Sabias que...") sobre una especie desde Wikipedia.
 *
 * Se cachea en AsyncStorage por dia + nombre cientifico para no repetir
 * la consulta en cada apertura del home (sensacion de "ficha trabajada",
 * no de IA generando algo al vuelo).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const WIKI_BASE = "https://es.wikipedia.org/api/rest_v1/page/summary/";
const STORAGE_KEY = "planty:plantFactOfTheDay";

function normalizeName(scientificName: string): string {
  return scientificName.trim().replace(/\s+/g, "_");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Recorta el extracto a 1-2 oraciones para que se vea como dato breve.
function shorten(extract: string): string {
  const sentences = extract.split(/(?<=[.!?])\s+/).filter(Boolean);
  const snippet = sentences.slice(0, 2).join(" ");
  return snippet.length > 280 ? `${snippet.slice(0, 277).trimEnd()}…` : snippet;
}

interface CachedFact {
  date: string;
  scientificName: string;
  fact: string;
}

const PlantFactService = {
  async getDailyFact(scientificName: string): Promise<string | null> {
    if (!scientificName?.trim()) return null;
    const date = todayIso();

    try {
      const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as CachedFact;
        if (cached.date === date && cached.scientificName === scientificName) {
          return cached.fact;
        }
      }
    } catch {
      // si el cache esta corrupto, seguimos con la consulta normal
    }

    try {
      const url = `${WIKI_BASE}${encodeURIComponent(normalizeName(scientificName))}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PlantyApp/1.0 (educational project)",
        },
      });
      if (!response.ok) return null;

      const data = (await response.json()) as { extract?: string };
      if (!data.extract) return null;

      const fact = shorten(data.extract);
      const toCache: CachedFact = { date, scientificName, fact };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toCache));
      return fact;
    } catch {
      return null;
    }
  },
};

export default PlantFactService;
