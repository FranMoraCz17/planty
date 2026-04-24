import json
import re
import urllib.request

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..models.identify import PlantIdentifyRequest, PlantIdentifyResponse

router = APIRouter(prefix="/api", tags=["identify"])

IDENTIFY_PROMPT = """
Analiza esta imagen y determina si es una planta.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "is_plant": true,
  "common_name": "Nombre común de la planta",
  "scientific_name": "Nombre científico",
  "confidence": "alta",
  "description": "Descripción breve de la planta en español (máx 2 oraciones).",
  "care_tips": [
    "Consejo de cuidado 1",
    "Consejo de cuidado 2",
    "Consejo de cuidado 3"
  ]
}

Si la imagen NO es una planta, responde:
{
  "is_plant": false,
  "common_name": "No identificado",
  "scientific_name": "",
  "confidence": "baja",
  "description": "La imagen no parece contener una planta.",
  "care_tips": []
}

No incluyas texto fuera del JSON.
""".strip()


@router.post("/identify-plant", response_model=PlantIdentifyResponse)
def identify_plant(body: PlantIdentifyRequest) -> dict:
    settings = get_settings()

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada en el servidor.")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
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
            "temperature": 0.2,
            "maxOutputTokens": 512,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al contactar Gemini: {exc}") from exc

    try:
        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("Sin JSON en la respuesta de Gemini.")
        result: dict = json.loads(match.group())
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"No se pudo parsear la respuesta de Gemini: {exc}",
        ) from exc

    return {
        "is_plant": bool(result.get("is_plant", False)),
        "common_name": str(result.get("common_name", "Desconocido")),
        "scientific_name": str(result.get("scientific_name", "")),
        "confidence": str(result.get("confidence", "baja")),
        "description": str(result.get("description", "")),
        "care_tips": list(result.get("care_tips", [])),
    }
