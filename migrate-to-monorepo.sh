#!/bin/bash
# migrate-to-monorepo.sh
# Ejecutar desde la RAÍZ de tu proyecto Expo actual (donde está package.json)
# 
# Uso:
#   chmod +x migrate-to-monorepo.sh
#   ./migrate-to-monorepo.sh

set -e

echo "🌿 Planty — Migración a Monorepo"
echo "================================="
echo ""

# Verificar que estamos en la raíz del proyecto Expo
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json."
  echo "   Ejecuta este script desde la raíz de tu proyecto Expo."
  exit 1
fi

echo "📁 Paso 1: Crear estructura de monorepo..."
mkdir -p ../planty-root/apps
mkdir -p ../planty-root/apps/api

echo "📱 Paso 2: Mover app mobile a apps/mobile..."
# Copiar todo el proyecto Expo a apps/mobile
cp -r . ../planty-root/apps/mobile

echo "🔧 Paso 3: Copiar archivos del monorepo raíz..."
# Los archivos que generó Claude van aquí
# cp /ruta/a/CLAUDE.md ../planty-root/CLAUDE.md
# cp /ruta/a/README.md ../planty-root/README.md
# cp /ruta/a/.gitignore ../planty-root/.gitignore

echo "🐍 Paso 4: Indicaciones para el backend..."
echo ""
echo "  Descomprime backend-api.zip dentro de ../planty-root/apps/api/"
echo "  Estructura esperada:"
echo "    apps/api/"
echo "    ├── app/"
echo "    │   ├── config.py"
echo "    │   ├── firebase.py"
echo "    │   ├── models.py"
echo "    │   ├── routes.py"
echo "    │   ├── services.py"
echo "    │   └── __init__.py"
echo "    ├── main.py"
echo "    ├── requirements.txt"
echo "    └── .env.example"

echo ""
echo "🔑 Paso 5: Mover serviceAccountKey.json..."
echo "  Mueve serviceAccountKey.json a la raíz del monorepo (planty-root/)"
echo "  Y actualiza apps/api/.env:"
echo "    FIREBASE_SERVICE_ACCOUNT_PATH=../../serviceAccountKey.json"

echo ""
echo "✅ Migración completada."
echo ""
echo "Estructura final en ../planty-root/:"
echo "  planty-root/"
echo "  ├── apps/"
echo "  │   ├── mobile/   (tu app Expo)"
echo "  │   └── api/      (FastAPI backend)"
echo "  ├── serviceAccountKey.json"
echo "  ├── .gitignore"
echo "  ├── README.md"
echo "  └── CLAUDE.md"
