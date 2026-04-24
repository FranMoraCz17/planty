from fastapi import APIRouter

from ..models.plant import CareLogModel, PlantModel, ReminderModel
from ..services import get_collection, get_document

router = APIRouter(prefix="/api", tags=["plants"])


@router.get("/plants/{plant_id}", response_model=PlantModel)
def read_plant(plant_id: str) -> dict:
    return get_document("plants", plant_id)


@router.get("/users/{user_id}/plants", response_model=list[PlantModel])
def read_user_plants(user_id: str) -> list[dict]:
    return get_collection("plants", filters=[("userId", "==", user_id)])


@router.get("/users/{user_id}/reminders", response_model=list[ReminderModel])
def read_user_reminders(user_id: str) -> list[dict]:
    return get_collection("reminders", filters=[("userId", "==", user_id)])


@router.get("/users/{user_id}/care-logs", response_model=list[CareLogModel])
def read_user_care_logs(user_id: str) -> list[dict]:
    return get_collection("careLogs", filters=[("userId", "==", user_id)])
