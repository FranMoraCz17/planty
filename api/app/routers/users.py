from fastapi import APIRouter

from ..models.user import UserModel, UserPreferencesModel
from ..services import get_collection, get_document

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}", response_model=UserModel)
def read_user(user_id: str) -> dict:
    return get_document("users", user_id)


@router.get("/{user_id}/preferences", response_model=UserPreferencesModel)
def read_user_preferences(user_id: str) -> dict:
    return get_document("userPreferences", user_id)
