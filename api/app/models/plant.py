from typing import Literal, Optional
from pydantic import BaseModel


class PlantModel(BaseModel):
    id: str
    userId: str
    name: str
    scientificName: Optional[str] = None
    locationName: Optional[str] = None
    wateringFrequencyLabel: Optional[str] = None
    photoUri: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class ReminderModel(BaseModel):
    id: str
    userId: str
    plantId: str
    title: str
    type: Optional[Literal["watering", "fertilizing", "pruning", "inspection"]] = None
    status: Optional[Literal["pending", "completed", "skipped"]] = "pending"
    priority: Optional[Literal["alta", "media", "baja"]] = None
    scheduledAt: Optional[str] = None
    completedAt: Optional[str] = None
    notes: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class CareLogModel(BaseModel):
    id: str
    userId: str
    plantId: str
    type: Optional[str] = None
    note: Optional[str] = None
    performedAt: Optional[str] = None
    createdAt: Optional[str] = None
