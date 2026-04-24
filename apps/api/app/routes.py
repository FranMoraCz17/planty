import json
import re
import urllib.request

from fastapi import APIRouter, HTTPException

from .config import get_settings
from .models import (
    ApiCollectionResponse,
    CareHistoryModel,
    CareScheduleModel,
    CategoryModel,
    PlantDetailResponse,
    PlantIdentifyRequest,
    PlantIdentifyResponse,
    PlantModel,
    PlantTagModel,
    UserInfoTileModel,
    UserModel,
    UserProfileResponse,
    UserStatModel,
)
from .services import get_collection, get_document

router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/users/{user_id}", response_model=UserModel)
def read_user(user_id: str) -> dict:
    return get_document("users", user_id)


@router.get("/api/users/{user_id}/profile", response_model=UserProfileResponse)
def read_user_profile(user_id: str) -> dict:
    user = get_document("users", user_id)
    stats = get_collection("userStats", filters=[("userId", "==", user_id)], order_by="order")
    info_tiles = get_collection(
        "userInfoTiles",
        filters=[("userId", "==", user_id)],
        order_by="order",
    )
    categories = get_collection(
        "categories",
        filters=[("userId", "==", user_id)],
        order_by="order",
    )

    favorite_plant = None
    favorite_plant_id = user.get("favoritePlantId")
    if isinstance(favorite_plant_id, str) and favorite_plant_id:
        favorite_plant = get_document("plants", favorite_plant_id)

    return {
        "user": user,
        "stats": stats,
        "infoTiles": info_tiles,
        "categories": categories,
        "favoritePlant": favorite_plant,
    }


@router.get("/api/users/{user_id}/plants", response_model=list[PlantModel])
def read_user_plants(user_id: str) -> list[dict]:
    return get_collection("plants", filters=[("userId", "==", user_id)], order_by="order")


@router.get("/api/plants/{plant_id}", response_model=PlantDetailResponse)
def read_plant_detail(plant_id: str) -> dict:
    plant = get_document("plants", plant_id)
    tags = get_collection("plantTags", filters=[("plantId", "==", plant_id)], order_by="order")
    return {"plant": plant, "tags": tags}


@router.get("/api/users/{user_id}/categories", response_model=list[CategoryModel])
def read_user_categories(user_id: str) -> list[dict]:
    return get_collection(
        "categories",
        filters=[("userId", "==", user_id)],
        order_by="order",
    )


@router.get("/api/users/{user_id}/plant-tags", response_model=list[PlantTagModel])
def read_user_plant_tags(user_id: str) -> list[dict]:
    return get_collection(
        "plantTags",
        filters=[("userId", "==", user_id)],
        order_by="order",
    )


@router.get("/api/users/{user_id}/care-schedule", response_model=list[CareScheduleModel])
def read_user_care_schedule(user_id: str) -> list[dict]:
    return get_collection(
        "careSchedule",
        filters=[("userId", "==", user_id)],
        order_by="scheduledFor",
    )


@router.get("/api/users/{user_id}/care-history", response_model=list[CareHistoryModel])
def read_user_care_history(user_id: str) -> list[dict]:
    return get_collection(
        "careHistory",
        filters=[("userId", "==", user_id)],
        order_by="completedAt",
    )


@router.get("/api/users/{user_id}/stats", response_model=list[UserStatModel])
def read_user_stats(user_id: str) -> list[dict]:
    return get_collection("userStats", filters=[("userId", "==", user_id)], order_by="order")


@router.get("/api/users/{user_id}/info-tiles", response_model=list[UserInfoTileModel])
def read_user_info_tiles(user_id: str) -> list[dict]:
    return get_collection(
        "userInfoTiles",
        filters=[("userId", "==", user_id)],
        order_by="order",
    )


@router.get("/api/collections/{collection_name}", response_model=ApiCollectionResponse)
def read_collection(collection_name: str) -> dict:
    items = get_collection(collection_name)
    return {
        "collection": collection_name,
        "count": len(items),
        "items": items,
    }


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


@router.post("/api/identify-plant", response_model=PlantIdentifyResponse)
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
        raise HTTPException(status_code=502, detail=f"No se pudo parsear la respuesta de Gemini: {exc}") from exc

    return {
        "is_plant": bool(result.get("is_plant", False)),
        "common_name": str(result.get("common_name", "Desconocido")),
        "scientific_name": str(result.get("scientific_name", "")),
        "confidence": str(result.get("confidence", "baja")),
        "description": str(result.get("description", "")),
        "care_tips": list(result.get("care_tips", [])),
    }
