#!/bin/bash

echo "🚀 PREPARANDO DEPLOY A CLOUD RUN..."
echo "=================================="

# 1. Verificar configuración
echo "📋 Verificando configuración..."
echo "Proyecto: $(gcloud config get-value project)"
echo "Región: us-central1"
echo "Servicio: pando-frontend"

# 2. Verificar que los archivos necesarios existen
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile no encontrado"
    exit 1
fi

if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "❌ Error: deploy.yml no encontrado"
    exit 1
fi

if [ ! -f "key.json" ]; then
    echo "❌ Error: key.json no encontrado. Ejecuta:"
    echo "gcloud iam service-accounts keys create key.json --iam-account=github-actions-sa@ascendant-altar-457900-v4.iam.gserviceaccount.com"
    exit 1
fi

# 3. Verificar secrets
echo "🔐 Verificando secrets..."
gcloud secrets versions list db-password --limit=1
gcloud secrets versions list gmail-user --limit=1
gcloud secrets versions list gmail-pass --limit=1
gcloud secrets versions list session-secret --limit=1

# 4. Commit y push a GitHub
echo "📤 Preparando para GitHub..."
echo "¿Quieres hacer commit y push de los cambios? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    git add .
    git commit -m "🚀 Configuración completa para Cloud Run CI/CD

- Configurado Dockerfile optimizado
- GitHub Actions workflow configurado
- Secrets configurados en Google Cloud
- Configuración para región us-central1
- Health checks implementados"
    
    echo "📤 Haciendo push a GitHub..."
    git push origin main
    
    echo "✅ ¡Push completado!"
    echo "🌐 Ve a GitHub Actions para monitorear el deployment:"
    echo "   https://github.com/EDY28-M/PANDO/actions"
else
    echo "⏭️  Skipping commit and push"
fi

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Ve a GitHub: https://github.com/EDY28-M/PANDO"
echo "2. Verifica que el secret GCP_SA_KEY esté configurado"
echo "3. El workflow se ejecutará automáticamente al hacer push"
echo "4. Monitorea el deployment en GitHub Actions"
echo ""
echo "📊 URLs importantes:"
echo "- GitHub Actions: https://github.com/EDY28-M/PANDO/actions"
echo "- Cloud Run Console: https://console.cloud.google.com/run?project=ascendant-altar-457900-v4"
echo "- Cloud SQL Console: https://console.cloud.google.com/sql?project=ascendant-altar-457900-v4"
echo ""
echo "🚀 ¡Tu aplicación estará disponible en Cloud Run después del deployment!"
