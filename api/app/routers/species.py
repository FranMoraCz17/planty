from fastapi import APIRouter

from ..models.species import SpeciesModel
from ..services import get_collection, get_document

router = APIRouter(prefix="/api/species", tags=["species"])


@router.get("", response_model=list[SpeciesModel])
def list_species() -> list[dict]:
    return get_collection("speciesCatalog")


@router.get("/{species_id}", response_model=SpeciesModel)
def read_species(species_id: str) -> dict:
    return get_document("speciesCatalog", species_id)
