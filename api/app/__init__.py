from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import diagnose, diagnoses, health, identify, plants, species, users


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Planty API",
        version="2.0.0",
        description="API REST para la app Planty — gestión de plantas con Firebase y Gemini Vision.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(plants.router)
    app.include_router(species.router)
    app.include_router(diagnoses.router)
    app.include_router(identify.router)
    app.include_router(diagnose.router)

    return app
