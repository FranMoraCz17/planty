from typing import Literal

from pydantic import BaseModel, Field


class FirestoreBaseModel(BaseModel):
    id: str
    createdAt: str
    updatedAt: str


class UserModel(FirestoreBaseModel):
    email: str
    displayName: str
    firstName: str
    lastName: str
    username: str
    avatarId: str
    provider: Literal["password", "google", "apple"]
    acceptedTerms: bool
    headline: str
    visibility: Literal["public", "private", "contacts"]
    birthDate: str
    streakDays: int
    streakText: str
    favoritePlantId: str
    themePreference: Literal["system", "light", "dark"]


class UserStatModel(FirestoreBaseModel):
    userId: str
    label: str
    value: str
    helper: str
    order: int


class UserInfoTileModel(FirestoreBaseModel):
    userId: str
    kind: Literal["birthDate", "visibility"]
    iconType: str
    iconEmoji: str
    order: int


class CategoryModel(FirestoreBaseModel):
    userId: str
    name: str
    iconType: str
    iconEmoji: str
    count: int
    order: int


class PlantCategorySnapshot(BaseModel):
    id: str
    name: str
    iconType: str
    iconEmoji: str


class PlantModel(FirestoreBaseModel):
    userId: str
    name: str
    nickname: str
    scientificName: str
    iconType: str
    iconEmoji: str
    categories: list[PlantCategorySnapshot]
    status: Literal["needs_care_today", "scheduled_soon", "on_track"]
    progress: int
    favorite: bool
    careFrequencyPerWeek: int
    description: str
    order: int


class PlantTagModel(FirestoreBaseModel):
    userId: str
    plantId: str
    value: str
    order: int


class CareScheduleModel(FirestoreBaseModel):
    userId: str
    plantId: str
    plantName: str
    iconType: str
    iconEmoji: str
    type: Literal["watering", "inspection"]
    status: Literal["pending", "completed"]
    scheduledFor: str


class CareHistoryModel(FirestoreBaseModel):
    userId: str
    plantId: str
    plantName: str
    iconType: str
    iconEmoji: str
    type: Literal["watering", "inspection"]
    status: Literal["completed", "skipped"]
    completedAt: str
    notes: str


class UserProfileResponse(BaseModel):
    user: UserModel
    stats: list[UserStatModel]
    infoTiles: list[UserInfoTileModel]
    categories: list[CategoryModel]
    favoritePlant: PlantModel | None = None


class PlantDetailResponse(BaseModel):
    plant: PlantModel
    tags: list[PlantTagModel] = Field(default_factory=list)


class ApiCollectionResponse(BaseModel):
    collection: str
    count: int
    items: list[dict]
