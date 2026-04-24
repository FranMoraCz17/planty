from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

from .config import get_settings


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.Client:
    settings = get_settings()

    if not settings.firebase_service_account_path.exists():
        raise FileNotFoundError(
            "No se encontro el archivo de credenciales de Firebase en "
            f"{settings.firebase_service_account_path}"
        )

    if not firebase_admin._apps:
        credential = credentials.Certificate(
            str(settings.firebase_service_account_path)
        )
        firebase_admin.initialize_app(credential)

    return firestore.client()
