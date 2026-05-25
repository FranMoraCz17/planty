from typing import Optional
from pydantic import BaseModel


class PlantIdentifyRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class SuggestedAreaType(BaseModel):
    indoor: bool
    light_level: str
    humidity_level: str
    reason: str


class PlantIdentifyResponse(BaseModel):
    is_plant: bool
    common_name: str
    scientific_name: str
    family: Optional[str] = None
    origin: Optional[str] = None
    confidence: int
    confidence_label: str
    description: str
    difficulty: str
    toxicity: str
    toxicity_detail: Optional[str] = None
    watering_frequency: str
    watering_detail: str
    light: str
    light_detail: str
    temperature: str
    humidity: str
    soil: str
    care_tips: list[str]
    common_pests: list[str]
    suggested_area_type: Optional[SuggestedAreaType] = None
    fun_fact: Optional[str] = None
