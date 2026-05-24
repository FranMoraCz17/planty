import CameraService from "./cameraService";

export type DiagnoseHealthStatus =
  | "saludable"
  | "atencion"
  | "enferma"
  | "critica";

export type DiagnoseIssueCategory =
  | "plaga"
  | "enfermedad"
  | "deficiencia"
  | "exceso"
  | "ambiental";

export type DiagnoseIssueSeverity = "baja" | "media" | "alta";

export interface DiagnoseIssue {
  category: DiagnoseIssueCategory;
  name: string;
  severity: DiagnoseIssueSeverity;
  description: string;
  treatment: string;
}

export interface DiagnoseResult {
  isPlant: boolean;
  healthStatus: DiagnoseHealthStatus;
  healthLabel: string;
  healthSummary: string;
  overallConfidence: number;
  issues: DiagnoseIssue[];
  immediateActions: string[];
  preventiveTips: string[];
  estimatedRecovery: string | null;
}

interface DiagnoseApiResponse {
  is_plant: boolean;
  health_status: string;
  health_label: string;
  health_summary: string;
  overall_confidence: number;
  issues: {
    category: string;
    name: string;
    severity: string;
    description: string;
    treatment: string;
  }[];
  immediate_actions: string[];
  preventive_tips: string[];
  estimated_recovery: string | null;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 75_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
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
    await fetchWithTimeout(
      `${API_BASE_URL}/health`,
      { method: "GET" },
      70_000,
    );
  } catch {
    // ignoramos: si el health falla, el request real lo manejará
  }
}

function normalizeHealthStatus(value: string): DiagnoseHealthStatus {
  switch (value) {
    case "saludable":
    case "atencion":
    case "enferma":
    case "critica":
      return value;
    default:
      return "atencion";
  }
}

function normalizeCategory(value: string): DiagnoseIssueCategory {
  switch (value) {
    case "plaga":
    case "enfermedad":
    case "deficiencia":
    case "exceso":
    case "ambiental":
      return value;
    default:
      return "ambiental";
  }
}

function normalizeSeverity(value: string): DiagnoseIssueSeverity {
  switch (value) {
    case "baja":
    case "media":
    case "alta":
      return value;
    default:
      return "baja";
  }
}

function mapResponse(raw: DiagnoseApiResponse): DiagnoseResult {
  return {
    isPlant: Boolean(raw.is_plant),
    healthStatus: normalizeHealthStatus(raw.health_status),
    healthLabel: raw.health_label || "Sin estado",
    healthSummary: raw.health_summary || "",
    overallConfidence: Math.max(0, Math.min(100, raw.overall_confidence ?? 0)),
    issues: (raw.issues ?? []).map((i) => ({
      category: normalizeCategory(i.category),
      name: i.name || "Sin nombre",
      severity: normalizeSeverity(i.severity),
      description: i.description || "",
      treatment: i.treatment || "",
    })),
    immediateActions: raw.immediate_actions ?? [],
    preventiveTips: raw.preventive_tips ?? [],
    estimatedRecovery: raw.estimated_recovery ?? null,
  };
}

const DiagnoseService = {
  async diagnoseFromUri(photoUri: string): Promise<DiagnoseResult> {
    const base64 = await CameraService.readAsBase64(photoUri);

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${API_BASE_URL}/api/diagnose-plant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: base64,
            mime_type: "image/jpeg",
          }),
        },
        REQUEST_TIMEOUT_MS,
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        await wakeBackend();
        response = await fetchWithTimeout(
          `${API_BASE_URL}/api/diagnose-plant`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_base64: base64,
              mime_type: "image/jpeg",
            }),
          },
          REQUEST_TIMEOUT_MS,
        );
      } else {
        throw new Error(
          "No se pudo contactar el servidor. Revisa tu conexion e intenta de nuevo.",
        );
      }
    }

    if (!response.ok) {
      let detail: string | null = null;
      try {
        const body = (await response.json()) as { detail?: string };
        detail = body?.detail ?? null;
      } catch {
        detail = null;
      }

      if (response.status === 429) {
        throw new Error(
          detail ??
            "Limite de solicitudes de IA alcanzado. Espera unos minutos.",
        );
      }
      throw new Error(detail ?? "No se pudo diagnosticar la planta.");
    }

    const data = (await response.json()) as DiagnoseApiResponse;
    return mapResponse(data);
  },
};

export default DiagnoseService;
