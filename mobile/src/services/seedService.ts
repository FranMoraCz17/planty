import PlantPhotoService from "./plantPhotoService";
import { saveDiagnose } from "./diagnoseHistoryService";
import type { DiagnoseResult } from "./diagnoseService";
import type { AreaDocument, CreateAreaInput } from "./areaService";
import type { PlantDocument } from "./plantService";
import type { EditablePlantFields } from "@/src/data/DemoDataProvider";

// Dependencias inyectadas desde el provider para que el estado en memoria se
// actualice (no escribimos a Firestore por fuera del flujo normal de la app).
interface SeedDeps {
  currentUserId: string;
  createArea: (data: CreateAreaInput) => Promise<AreaDocument>;
  createPlant: (data: EditablePlantFields) => Promise<PlantDocument>;
}

export interface SeedSummary {
  areas: number;
  plants: number;
  diagnoses: number;
}

// Foto de respaldo para áreas: Picsum por seed siempre carga (cero URLs rotas).
const areaPhoto = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

const AREA_SEEDS: Omit<CreateAreaInput, "userId">[] = [
  {
    name: "Sala principal",
    description: "Espacio luminoso con luz filtrada por cortinas durante la mañana.",
    photoUri: areaPhoto("planty-sala"),
    lightLevel: "luz-indirecta",
    humidityLevel: "media",
    indoor: true,
    type: "casa",
    zone: "Planta baja",
  },
  {
    name: "Balcón",
    description: "Exterior con sol de mañana y buena ventilación.",
    photoUri: areaPhoto("planty-balcon"),
    lightLevel: "luz-brillante",
    humidityLevel: "baja",
    indoor: false,
    type: "balcon",
    zone: "Frente",
  },
  {
    name: "Patio trasero",
    description: "Zona de sol directo, ideal para aromáticas y suculentas.",
    photoUri: areaPhoto("planty-patio"),
    lightLevel: "sol-directo",
    humidityLevel: "media",
    indoor: false,
    type: "patio",
    zone: "Atrás",
  },
  {
    name: "Estudio",
    description: "Rincón de sombra con humedad estable, lejos de corrientes.",
    photoUri: areaPhoto("planty-estudio"),
    lightLevel: "sombra",
    humidityLevel: "alta",
    indoor: true,
    type: "casa",
    zone: "Segundo piso",
  },
  {
    name: "Invernadero",
    description: "Ambiente controlado, cálido y húmedo para especies delicadas.",
    photoUri: areaPhoto("planty-invernadero"),
    lightLevel: "luz-brillante",
    humidityLevel: "alta",
    indoor: false,
    type: "invernadero",
    zone: "Jardín",
  },
];

interface PlantSeed {
  name: string;
  scientificName: string;
  areaIndex: number;
  wateringFrequencyLabel: string;
  wateringFrequencyDays: number;
  aiLight: string;
  aiDescription: string;
  daysAgoAcquired: number;
}

const PLANT_SEEDS: PlantSeed[] = [
  {
    name: "Monstera",
    scientificName: "Monstera deliciosa",
    areaIndex: 0,
    wateringFrequencyLabel: "Cada 7 dias",
    wateringFrequencyDays: 7,
    aiLight: "Luz indirecta brillante",
    aiDescription:
      "Trepadora tropical de hojas grandes y fenestradas. Prefiere luz filtrada y un sustrato aireado que drene bien.",
    daysAgoAcquired: 120,
  },
  {
    name: "Potos",
    scientificName: "Epipremnum aureum",
    areaIndex: 0,
    wateringFrequencyLabel: "Cada 7 dias",
    wateringFrequencyDays: 7,
    aiLight: "Luz indirecta",
    aiDescription:
      "Enredadera muy resistente, ideal para principiantes. Tolera sombra parcial y purifica el aire del ambiente.",
    daysAgoAcquired: 90,
  },
  {
    name: "Lengua de suegra",
    scientificName: "Dracaena trifasciata",
    areaIndex: 3,
    wateringFrequencyLabel: "Cada 14 dias",
    wateringFrequencyDays: 14,
    aiLight: "Tolera sombra",
    aiDescription:
      "Suculenta vertical extremadamente tolerante a la sequía. Riego escaso y luz baja a media bastan para mantenerla sana.",
    daysAgoAcquired: 200,
  },
  {
    name: "Ficus lira",
    scientificName: "Ficus lyrata",
    areaIndex: 0,
    wateringFrequencyLabel: "Cada 8 dias",
    wateringFrequencyDays: 8,
    aiLight: "Luz brillante indirecta",
    aiDescription:
      "Arbusto de hojas grandes con forma de lira. Sensible a cambios de lugar y a corrientes de aire frío.",
    daysAgoAcquired: 60,
  },
  {
    name: "Aloe vera",
    scientificName: "Aloe vera",
    areaIndex: 1,
    wateringFrequencyLabel: "Cada 15 dias",
    wateringFrequencyDays: 15,
    aiLight: "Sol directo a media sombra",
    aiDescription:
      "Suculenta medicinal de hojas carnosas. Almacena agua, por lo que tolera periodos largos sin riego.",
    daysAgoAcquired: 150,
  },
  {
    name: "Lavanda",
    scientificName: "Lavandula angustifolia",
    areaIndex: 2,
    wateringFrequencyLabel: "Cada 6 dias",
    wateringFrequencyDays: 6,
    aiLight: "Sol directo",
    aiDescription:
      "Aromática mediterránea de flores moradas. Requiere mucho sol y sustrato pobre y bien drenado.",
    daysAgoAcquired: 45,
  },
  {
    name: "Albahaca",
    scientificName: "Ocimum basilicum",
    areaIndex: 2,
    wateringFrequencyLabel: "Cada 2 dias",
    wateringFrequencyDays: 2,
    aiLight: "Sol directo parcial",
    aiDescription:
      "Hierba culinaria de crecimiento rápido. Necesita riego frecuente y pellizcar las puntas para que ramifique.",
    daysAgoAcquired: 20,
  },
  {
    name: "Cactus bola de oro",
    scientificName: "Echinocactus grusonii",
    areaIndex: 1,
    wateringFrequencyLabel: "Cada 20 dias",
    wateringFrequencyDays: 20,
    aiLight: "Sol directo",
    aiDescription:
      "Cactus globular de espinas doradas. Riego muy espaciado y máxima exposición solar para mantener su forma.",
    daysAgoAcquired: 300,
  },
  {
    name: "Cuna de Moisés",
    scientificName: "Spathiphyllum wallisii",
    areaIndex: 3,
    wateringFrequencyLabel: "Cada 5 dias",
    wateringFrequencyDays: 5,
    aiLight: "Sombra a luz indirecta",
    aiDescription:
      "Planta de interior con flores blancas. Avisa la falta de agua dejando caer las hojas, que se recuperan al regar.",
    daysAgoAcquired: 75,
  },
  {
    name: "Orquídea",
    scientificName: "Phalaenopsis amabilis",
    areaIndex: 4,
    wateringFrequencyLabel: "Cada 9 dias",
    wateringFrequencyDays: 9,
    aiLight: "Luz indirecta brillante",
    aiDescription:
      "Orquídea elegante de floración prolongada. Vive en sustrato de corteza y agradece humedad ambiental alta.",
    daysAgoAcquired: 110,
  },
];

const HEALTHY: DiagnoseResult = {
  isPlant: true,
  healthStatus: "saludable",
  healthLabel: "Saludable",
  healthSummary:
    "La planta luce vigorosa, con follaje uniforme y sin signos visibles de plagas ni deficiencias.",
  overallConfidence: 88,
  issues: [],
  immediateActions: ["Mantener el riego y la ubicación actuales."],
  preventiveTips: ["Limpiar el polvo de las hojas cada dos semanas."],
  estimatedRecovery: null,
};

const ATTENTION: DiagnoseResult = {
  isPlant: true,
  healthStatus: "atencion",
  healthLabel: "Requiere atención",
  healthSummary:
    "Se observan puntas marrones en algunas hojas, posiblemente por aire seco o un leve exceso de riego.",
  overallConfidence: 74,
  issues: [
    {
      category: "ambiental",
      name: "Puntas quemadas",
      severity: "media",
      description: "Bordes marrones asociados a baja humedad ambiental.",
      treatment: "Aumentar la humedad y revisar que el sustrato drene bien.",
    },
  ],
  immediateActions: ["Reducir el riego durante una semana.", "Alejar de fuentes de calor."],
  preventiveTips: ["Agrupar plantas cercanas para elevar la humedad local."],
  estimatedRecovery: "2 semanas con cuidados constantes",
};

// Qué plantas (por índice) reciben registros de diagnóstico en la clínica.
const DIAGNOSE_SEEDS: { plantIndex: number; result: DiagnoseResult }[] = [
  { plantIndex: 0, result: HEALTHY },
  { plantIndex: 3, result: ATTENTION },
  { plantIndex: 6, result: HEALTHY },
  { plantIndex: 8, result: ATTENTION },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SeedService = {
  /**
   * Puebla la cuenta del usuario con áreas, plantas (con foto real de cada
   * especie vía Wikipedia) y registros de diagnóstico. Idempotencia: NO la
   * controla — pensado para una cuenta vacía o de demostración.
   */
  async seedDemoData({
    currentUserId,
    createArea,
    createPlant,
  }: SeedDeps): Promise<SeedSummary> {
    if (!currentUserId) {
      throw new Error("No hay un usuario autenticado para poblar datos.");
    }

    // 1. Áreas
    const createdAreas: AreaDocument[] = [];
    for (const area of AREA_SEEDS) {
      const created = await createArea({ ...area, userId: currentUserId });
      createdAreas.push(created);
    }

    // 2. Plantas (foto real por especie desde Wikipedia)
    const createdPlants: PlantDocument[] = [];
    for (const seed of PLANT_SEEDS) {
      const area = createdAreas[seed.areaIndex] ?? null;
      const photoUri = await PlantPhotoService.fetchSpeciesPhoto(
        seed.scientificName,
      ).catch(() => null);

      const created = await createPlant({
        name: seed.name,
        scientificName: seed.scientificName,
        locationName: area?.name ?? "Sin ubicación",
        wateringFrequencyLabel: seed.wateringFrequencyLabel,
        wateringFrequencyDays: seed.wateringFrequencyDays,
        areaId: area?.id ?? null,
        acquiredAt: isoDaysAgo(seed.daysAgoAcquired),
        aiAnalyzed: true,
        aiDescription: seed.aiDescription,
        aiLight: seed.aiLight,
        photoUri: photoUri ?? undefined,
      });
      createdPlants.push(created);
    }

    // 3. Diagnósticos (clínica)
    let diagnoses = 0;
    for (const { plantIndex, result } of DIAGNOSE_SEEDS) {
      const plant = createdPlants[plantIndex];
      if (!plant) continue;
      await saveDiagnose(plant.id, plant.name, result, plant.photoUri);
      diagnoses += 1;
    }

    return {
      areas: createdAreas.length,
      plants: createdPlants.length,
      diagnoses,
    };
  },
};

export default SeedService;
