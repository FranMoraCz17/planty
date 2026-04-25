from typing import Optional
from pydantic import BaseModel


class UserModel(BaseModel):
    id: str
    email: str
    username: str
    name: str
    city: Optional[str] = None
    avatarUrl: Optional[str] = None
    streakDays: Optional[int] = 0
    pendingCount: Optional[int] = 0
    collectionCount: Optional[int] = 0
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class UserPreferencesModel(BaseModel):
    id: str
    userId: str
    theme: Optional[str] = "system"
    language: Optional[str] = "es"
    notificationsEnabled: Optional[bool] = True
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
