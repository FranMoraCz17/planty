# Imagen de la API de Planty.
# Dos etapas: la primera instala dependencias, la segunda solo copia lo necesario
# para correr. Así la imagen final no lleva herramientas de compilación.

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app

FROM base AS deps
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

FROM base
COPY --from=deps /install /usr/local
COPY VERSION main.py ./
COPY app ./app

# Usuario sin privilegios: el contenedor nunca corre como root.
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin planty
USER 10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

# Uvicorn recibe SIGTERM directamente (forma exec) y cierra ordenadamente.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--timeout-graceful-shutdown", "20"]
