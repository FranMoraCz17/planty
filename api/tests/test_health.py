from fastapi.testclient import TestClient

from app import VERSION, create_app

client = TestClient(create_app())


def test_health_responde_ok():
    respuesta = client.get("/health")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"status": "ok"}


def test_version_publicada_coincide_con_archivo_version():
    assert client.get("/openapi.json").json()["info"]["version"] == VERSION
