/**
 * Datos curiosos ("Sabias que...") guardados como favoritos por el usuario.
 *
 * Persistencia local en AsyncStorage — no requiere backend, similar al
 * cache de plantFactService.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "planty:favoriteFacts";

export interface FavoriteFact {
  id: string;
  scientificName: string;
  fact: string;
  savedAt: string;
}

async function readAll(): Promise<FavoriteFact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteFact[];
  } catch {
    return [];
  }
}

async function writeAll(items: FavoriteFact[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const FavoriteFactsService = {
  async getAll(): Promise<FavoriteFact[]> {
    const items = await readAll();
    return [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },

  async isFavorite(scientificName: string, fact: string): Promise<boolean> {
    const items = await readAll();
    return items.some((f) => f.scientificName === scientificName && f.fact === fact);
  },

  // Devuelve el nuevo estado (true = quedo guardado, false = se quito).
  async toggleFavorite(scientificName: string, fact: string): Promise<boolean> {
    const items = await readAll();
    const idx = items.findIndex((f) => f.scientificName === scientificName && f.fact === fact);
    if (idx >= 0) {
      items.splice(idx, 1);
      await writeAll(items);
      return false;
    }
    items.push({
      id: `${Date.now()}`,
      scientificName,
      fact,
      savedAt: new Date().toISOString(),
    });
    await writeAll(items);
    return true;
  },

  async remove(id: string): Promise<void> {
    const items = await readAll();
    await writeAll(items.filter((f) => f.id !== id));
  },
};

export default FavoriteFactsService;
