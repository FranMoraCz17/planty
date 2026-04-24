from typing import Literal, Optional
from pydantic import BaseModel


class DiagnosisModel(BaseModel):
    id: str
    userId: str
    plantId: str
    photoId: Optional[str] = None
    result: Optional[str] = None
    confidence: Optional[int] = None
    severity: Optional[Literal["low", "medium", "high"]] = None
    source: Optional[Literal["ai", "manual"]] = None
    notes: Optional[str] = None
    diagnosedAt: Optional[str] = None
    createdAt: Optional[str] = None


class PhotoModel(BaseModel):
    id: str
    userId: str
    plantId: str
    url: str
    type: Optional[Literal["diagnosis", "progress", "identification"]] = None
    caption: Optional[str] = None
    diagnosisId: Optional[str] = None
    createdAt: Optional[str] = None


class PlantHealthRecordModel(BaseModel):
    id: str
    userId: str
    plantId: str
    status: Optional[str] = None
    notes: Optional[str] = None
    recordedAt: Optional[str] = None
    createdAt: Optional[str] = None
