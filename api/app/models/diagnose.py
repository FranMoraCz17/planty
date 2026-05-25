from typing import Optional
from pydantic import BaseModel


class PlantDiagnoseRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class DiagnoseIssue(BaseModel):
    category: str  # plaga | enfermedad | deficiencia | exceso | ambiental
    name: str
    severity: str  # baja | media | alta
    description: str
    treatment: str


class PlantDiagnoseResponse(BaseModel):
    is_plant: bool
    health_status: str  # saludable | atencion | enferma | critica
    health_label: str
    health_summary: str
    overall_confidence: int
    issues: list[DiagnoseIssue]
    immediate_actions: list[str]
    preventive_tips: list[str]
    estimated_recovery: Optional[str] = None
