from pydantic import BaseModel


class PlantIdentifyRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class PlantIdentifyResponse(BaseModel):
    is_plant: bool
    common_name: str
    scientific_name: str
    confidence: str
    description: str
    care_tips: list[str]
