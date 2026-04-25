import CameraService from "./cameraService";

export interface PlantIdentifyResult {
  isPlant: boolean;
  commonName: string;
  scientificName: string;
  family: string | null;
  origin: string | null;
  confidence: number;
  confidenceLabel: string;
  description: string;
  difficulty: string;
  toxicity: string;
  toxicityDetail: string | null;
  wateringFrequency: string;
  wateringDetail: string;
  light: string;
  lightDetail: string;
  temperature: string;
  humidity: string;
  soil: string;
  careTips: string[];
  commonPests: string[];
  funFact: string | null;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface IdentifyApiResponse {
  is_plant: boolean;
  common_name: string;
  scientific_name: string;
  family: string | null;
  origin: string | null;
  confidence: number;
  confidence_label: string;
  description: string;
  difficulty: string;
  toxicity: string;
  toxicity_detail: string | null;
  watering_frequency: string;
  watering_detail: string;
  light: string;
  light_detail: string;
  temperature: string;
  humidity: string;
  soil: string;
  care_tips: string[];
  common_pests: string[];
  fun_fact: string | null;
}

const REQUEST_TIMEOUT_MS = 75_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function wakeBackend(): Promise<void> {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/health`, { method: "GET" }, 70_000);
  } catch {
    // ignoramos: si el health falla, el request real lo manejará
  }
}

const IdentifyService = {
  async identifyFromUri(photoUri: string): Promise<PlantIdentifyResult> {
    const base64 = await CameraService.readAsBase64(photoUri);

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${API_BASE_URL}/api/identify-plant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64, mime_type: "image/jpeg" }),
        },
        REQUEST_TIMEOUT_MS,
      );
    } catch (err) {
      // si fue abort por timeout, intentamos despertar el backend y reintentar una vez
      if (err instanceof Error && err.name === "AbortError") {
        await wakeBackend();
        response = await fetchWithTimeout(
          `${API_BASE_URL}/api/identify-plant`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: base64, mime_type: "image/jpeg" }),
          },
          REQUEST_TIMEOUT_MS,
        );
      } else {
        throw new Error("No se pudo contactar el servidor. Revisa tu conexión e intenta de nuevo.");
      }
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.");
      }
      const errorBody = await response.text();
      throw new Error(`Error del servidor (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as IdentifyApiResponse;

    return {
      isPlant: data.is_plant,
      commonName: data.common_name,
      scientificName: data.scientific_name,
      family: data.family,
      origin: data.origin,
      confidence: data.confidence,
      confidenceLabel: data.confidence_label,
      description: data.description,
      difficulty: data.difficulty,
      toxicity: data.toxicity,
      toxicityDetail: data.toxicity_detail,
      wateringFrequency: data.watering_frequency,
      wateringDetail: data.watering_detail,
      light: data.light,
      lightDetail: data.light_detail,
      temperature: data.temperature,
      humidity: data.humidity,
      soil: data.soil,
      careTips: data.care_tips,
      commonPests: data.common_pests,
      funFact: data.fun_fact,
    };
  },
};

export default IdentifyService;
