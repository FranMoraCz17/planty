import json
import re
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..models.diagnose import PlantDiagnoseRequest, PlantDiagnoseResponse

router = APIRouter(prefix="/api", tags=["diagnose"])

DIAGNOSE_PROMPT = """
Eres un fitopatólogo experto en salud de plantas (especialista en enfermedades, plagas y deficiencias nutricionales). Analiza la imagen de una planta o de hojas de planta y entrega un diagnóstico profesional del estado de salud visible.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta. No incluyas texto fuera del JSON, no incluyas markdown, no incluyas backticks.

{
  "is_plant": true,
  "health_status": "atencion",
  "health_label": "Requiere atención",
  "health_summary": "Resumen en máximo 2 oraciones del estado general visible en la imagen.",
  "overall_confidence": 78,
  "issues": [
    {
      "category": "deficiencia",
      "name": "Clorosis por falta de hierro",
      "severity": "media",
      "description": "Hojas jóvenes amarillean entre las venas verdes. Asociado a pH alto o sustrato pobre en hierro.",
      "treatment": "Aplicar quelato de hierro foliar cada 15 días y revisar drenaje del sustrato."
    }
  ],
  "immediate_actions": [
    "Aislar la planta de otras durante 7 días para evitar contagio.",
    "Reducir el riego a la mitad durante una semana."
  ],
  "preventive_tips": [
    "Limpiar las hojas con un paño húmedo cada dos semanas.",
    "Asegurar ventilación cruzada en el ambiente."
  ],
  "estimated_recovery": "2 a 3 semanas con tratamiento constante"
}

Reglas estrictas para los campos:
- "health_status" debe ser exactamente uno de: "saludable", "atencion", "enferma", "critica".
- "health_label" es la versión legible del status en español natural.
- "overall_confidence" debe ser un entero entre 0 y 100.
- "issues" puede ser lista vacía si la planta está saludable.
- "issues[].category" debe ser uno de: "plaga", "enfermedad", "deficiencia", "exceso", "ambiental".
- "issues[].severity" debe ser uno de: "baja", "media", "alta".
- "immediate_actions" y "preventive_tips" son listas de oraciones cortas en imperativo.
- "estimated_recovery" puede ser null si no aplica (planta saludable o sin tratamiento posible).

Si la imagen NO es una planta o no se distingue claramente, responde:
{
  "is_plant": false,
  "health_status": "atencion",
  "health_label": "Imagen no procesable",
  "health_summary": "La imagen no parece contener una planta identificable. Asegúrate de tomar la fotografía con buena iluminación, enfocando hojas o tallos.",
  "overall_confidence": 0,
  "issues": [],
  "immediate_actions": [],
  "preventive_tips": [],
  "estimated_recovery": null
}
""".strip()


@router.post("/diagnose-plant", response_model=PlantDiagnoseResponse)
def diagnose_plant(body: PlantDiagnoseRequest) -> dict:
    settings = get_settings()

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada en el servidor.")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    )

    payload = json.dumps({
        "contents": [
            {
                "parts": [
                    {"text": DIAGNOSE_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": body.mime_type,
                            "data": body.image_base64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail="Limite de solicitudes de IA alcanzado. Intenta de nuevo en unos minutos.",
            ) from exc
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}") from exc

    try:
        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```\s*$", "", cleaned)
        first = cleaned.find("{")
        last = cleaned.rfind("}")
        if first == -1 or last == -1 or last <= first:
            raise ValueError(f"Sin JSON en la respuesta. Texto recibido: {text[:200]}")
        result: dict = json.loads(cleaned[first : last + 1])
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo parsear la respuesta de Gemini: {exc}",
        ) from exc

    confidence_raw = result.get("overall_confidence", 0)
    try:
        confidence_int = int(confidence_raw)
    except (ValueError, TypeError):
        confidence_int = 0
    confidence_int = max(0, min(100, confidence_int))

    issues_raw = result.get("issues", []) or []
    issues_clean: list[dict] = []
    for raw_issue in issues_raw:
        if not isinstance(raw_issue, dict):
            continue
        issues_clean.append({
            "category": str(raw_issue.get("category", "ambiental")),
            "name": str(raw_issue.get("name", "Sin nombre")),
            "severity": str(raw_issue.get("severity", "baja")),
            "description": str(raw_issue.get("description", "")),
            "treatment": str(raw_issue.get("treatment", "")),
        })

    return {
        "is_plant": bool(result.get("is_plant", False)),
        "health_status": str(result.get("health_status", "atencion")),
        "health_label": str(result.get("health_label", "Sin estado")),
        "health_summary": str(result.get("health_summary", "")),
        "overall_confidence": confidence_int,
        "issues": issues_clean,
        "immediate_actions": list(result.get("immediate_actions", [])),
        "preventive_tips": list(result.get("preventive_tips", [])),
        "estimated_recovery": result.get("estimated_recovery") or None,
    }
