from fastapi import APIRouter

from ..models.diagnosis import DiagnosisModel, PhotoModel, PlantHealthRecordModel
from ..services import get_collection, get_document

router = APIRouter(prefix="/api", tags=["diagnoses"])


@router.get("/users/{user_id}/diagnoses", response_model=list[DiagnosisModel])
def read_user_diagnoses(user_id: str) -> list[dict]:
    return get_collection("diagnoses", filters=[("userId", "==", user_id)])


@router.get("/diagnoses/{diagnosis_id}", response_model=DiagnosisModel)
def read_diagnosis(diagnosis_id: str) -> dict:
    return get_document("diagnoses", diagnosis_id)


@router.get("/users/{user_id}/photos", response_model=list[PhotoModel])
def read_user_photos(user_id: str) -> list[dict]:
    return get_collection("photos", filters=[("userId", "==", user_id)])


@router.get("/plants/{plant_id}/photos", response_model=list[PhotoModel])
def read_plant_photos(plant_id: str) -> list[dict]:
    return get_collection("photos", filters=[("plantId", "==", plant_id)])


@router.get("/users/{user_id}/health-records", response_model=list[PlantHealthRecordModel])
def read_user_health_records(user_id: str) -> list[dict]:
    return get_collection("plantHealthRecords", filters=[("userId", "==", user_id)])
