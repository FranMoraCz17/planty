from typing import Optional
from pydantic import BaseModel


class SpeciesModel(BaseModel):
    id: str
    commonName: str
    scientificName: str
    category: Optional[str] = None
    defaultWateringFrequencyLabel: Optional[str] = None
    defaultLightRequirement: Optional[str] = None
    notes: Optional[str] = None
    createdAt: Optional[str] = None
