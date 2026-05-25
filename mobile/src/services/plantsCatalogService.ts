import datasetJson from "@/src/data/plantsDataset.json";

export interface PlantCatalogItem {
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCatalogCategory;
  tags: string[];
}

export type PlantCatalogCategory =
  | "domestica"
  | "agricola"
  | "hortaliza"
  | "aromatica"
  | "ornamental"
  | "arbol";

const RAW = datasetJson.plants as PlantCatalogItem[];

/**
 * Normaliza un string para busqueda: minusculas, sin tildes, sin nh, sin caracteres
 * especiales. "Maíz" -> "maiz", "Naranja" -> "naranja".
 */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tildes
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

interface ScoredItem {
  item: PlantCatalogItem;
  score: number;
}

/**
 * Score basado en cuán bien matchea la consulta:
 * - +10 si el commonName empieza con la query
 * - +5 si el commonName contiene la query
 * - +3 si scientificName contiene
 * - +2 si family contiene
 * - +1 por cada tag matched
 */
function scoreItem(item: PlantCatalogItem, query: string): number {
  if (!query) return 0;
  const n = normalize(query);
  const common = normalize(item.commonName);
  const sci = normalize(item.scientificName);
  const fam = normalize(item.family);
  const tags = item.tags.map(normalize);

  let score = 0;
  if (common.startsWith(n)) score += 10;
  else if (common.includes(n)) score += 5;
  if (sci.includes(n)) score += 3;
  if (fam.includes(n)) score += 2;
  for (const t of tags) {
    if (t.includes(n)) score += 1;
  }
  return score;
}

const PlantsCatalogService = {
  /**
   * Busqueda fuzzy en el dataset offline.
   * Si query esta vacia, devuelve un sample de las plantas mas comunes (por categoria domestica).
   */
  search(query: string, limit = 30): PlantCatalogItem[] {
    const trimmed = query.trim();
    if (!trimmed) {
      // sin query: mostramos un mix variado de hasta `limit`
      const sample = [
        ...RAW.filter((p) => p.category === "domestica").slice(0, limit / 2),
        ...RAW.filter((p) => p.category === "agricola").slice(0, limit / 4),
        ...RAW.filter((p) => p.category === "aromatica").slice(0, limit / 4),
      ];
      return sample.slice(0, limit);
    }

    const scored: ScoredItem[] = RAW.map((item) => ({
      item,
      score: scoreItem(item, trimmed),
    })).filter((s) => s.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.item);
  },

  /**
   * Devuelve todas las plantas. Util para pantallas que listan por categoria.
   */
  getAll(): PlantCatalogItem[] {
    return RAW;
  },

  getByCategory(category: PlantCatalogCategory): PlantCatalogItem[] {
    return RAW.filter((p) => p.category === category);
  },

  getCategoryLabel(category: PlantCatalogCategory): string {
    switch (category) {
      case "domestica":
        return "Domestica";
      case "agricola":
        return "Agricola";
      case "hortaliza":
        return "Hortaliza";
      case "aromatica":
        return "Aromatica";
      case "ornamental":
        return "Ornamental";
      case "arbol":
        return "Arbol";
    }
  },
};

export default PlantsCatalogService;
