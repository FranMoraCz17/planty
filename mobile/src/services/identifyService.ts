import CameraService from "./cameraService";

export interface PlantIdentifyResult {
  isPlant: boolean;
  commonName: string;
  scientificName: string;
  confidence: string;
  description: string;
  careTips: string[];
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const IdentifyService = {
  async identifyFromUri(photoUri: string): Promise<PlantIdentifyResult> {
    const base64 = await CameraService.readAsBase64(photoUri);

    const response = await fetch(`${API_BASE_URL}/api/identify-plant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: base64,
        mime_type: "image/jpeg",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.");
      }
      const errorBody = await response.text();
      throw new Error(`Error del servidor (${response.status}): ${errorBody}`);
    }

    const data = await response.json() as {
      is_plant: boolean;
      common_name: string;
      scientific_name: string;
      confidence: string;
      description: string;
      care_tips: string[];
    };

    return {
      isPlant: data.is_plant,
      commonName: data.common_name,
      scientificName: data.scientific_name,
      confidence: data.confidence,
      description: data.description,
      careTips: data.care_tips,
    };
  },
};

export default IdentifyService;
