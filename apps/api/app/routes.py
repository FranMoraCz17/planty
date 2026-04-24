from fastapi import APIRouter

from .models import (
    ApiCollectionResponse,
    CareHistoryModel,
    CareScheduleModel,
    CategoryModel,
    PlantDetailResponse,
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
