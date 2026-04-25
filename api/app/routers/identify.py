import json
import re
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..models.identify import PlantIdentifyRequest, PlantIdentifyResponse

router = APIRouter(prefix="/api", tags=["identify"])

IDENTIFY_PROMPT = """
Eres un botánico experto. Analiza la imagen y determina si es una planta. Si lo es, responde con un análisis detallado y profesional en español.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta. No incluyas texto fuera del JSON, no incluyas markdown, no incluyas backticks.

{
  "is_plant": true,
  "common_name": "Nombre común en español",
  "scientific_name": "Nombre científico latino",
  "family": "Familia botánica",
  "origin": "Región o continente de origen",
  "confidence": 92,
  "confidence_label": "alta",
  "description": "Descripción breve y profesional de la planta en máximo 3 oraciones, mencionando características visibles y rasgos distintivos.",
  "difficulty": "fácil",
  "toxicity": "tóxica",
  "toxicity_detail": "Tóxica para perros y gatos por contener cristales de oxalato de calcio.",
  "watering_frequency": "Cada 5 a 7 días",
  "watering_detail": "Regar cuando los primeros 3 cm del sustrato estén secos, evitar encharcar.",
  "light": "Luz indirecta brillante",
  "light_detail": "Tolera sombra parcial, no resiste sol directo prolongado.",
  "temperature": "18°C a 27°C",
  "humidity": "Media a alta (50-70%)",
  "soil": "Sustrato bien drenado con materia orgánica",
  "care_tips": [
    "Limpiar las hojas con un paño húmedo cada dos semanas",
    "Fertilizar mensualmente en primavera y verano",
    "Trasplantar cada dos años a una maceta ligeramente mayor"
  ],
  "common_pests": ["Cochinilla algodonosa", "Araña roja"],
  "fun_fact": "Un dato curioso o interesante sobre la planta en una oración."
}

Reglas estrictas para los campos:
- "confidence" debe ser un número entero entre 0 y 100.
- "confidence_label" debe ser exactamente uno de: "alta", "media", "baja".
- "difficulty" debe ser exactamente uno de: "fácil", "media", "alta".
- "toxicity" debe ser exactamente uno de: "no tóxica", "leve", "tóxica".
- "common_pests" puede ser lista vacía si no aplica.
- "fun_fact" puede ser null si no hay dato relevante.

Si la imagen NO es una planta o no se distingue claramente, responde:
{
  "is_plant": false,
  "common_name": "No identificado",
  "scientific_name": "",
  "family": null,
  "origin": null,
  "confidence": 0,
  "confidence_label": "baja",
  "description": "La imagen no parece contener una planta identificable. Asegúrate de tomar la fotografía con buena iluminación y enfocando las hojas o flores.",
  "difficulty": "media",
  "toxicity": "no tóxica",
  "toxicity_detail": null,
  "watering_frequency": "",
  "watering_detail": "",
  "light": "",
  "light_detail": "",
  "temperature": "",
  "humidity": "",
  "soil": "",
  "care_tips": [],
  "common_pests": [],
  "fun_fact": null
}
""".strip()


@router.post("/identify-plant", response_model=PlantIdentifyResponse)
def identify_plant(body: PlantIdentifyRequest) -> dict:
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
                    {"text": IDENTIFY_PROMPT},
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

    confidence_raw = result.get("confidence", 0)
    try:
        confidence_int = int(confidence_raw)
    except (ValueError, TypeError):
        confidence_int = 0
    confidence_int = max(0, min(100, confidence_int))

    return {
        "is_plant": bool(result.get("is_plant", False)),
        "common_name": str(result.get("common_name", "No identificado")),
        "scientific_name": str(result.get("scientific_name", "")),
        "family": result.get("family") or None,
        "origin": result.get("origin") or None,
        "confidence": confidence_int,
        "confidence_label": str(result.get("confidence_label", "baja")),
        "description": str(result.get("description", "")),
        "difficulty": str(result.get("difficulty", "media")),
        "toxicity": str(result.get("toxicity", "no tóxica")),
        "toxicity_detail": result.get("toxicity_detail") or None,
        "watering_frequency": str(result.get("watering_frequency", "")),
        "watering_detail": str(result.get("watering_detail", "")),
        "light": str(result.get("light", "")),
        "light_detail": str(result.get("light_detail", "")),
        "temperature": str(result.get("temperature", "")),
        "humidity": str(result.get("humidity", "")),
        "soil": str(result.get("soil", "")),
        "care_tips": list(result.get("care_tips", [])),
        "common_pests": list(result.get("common_pests", [])),
        "fun_fact": result.get("fun_fact") or None,
    }
