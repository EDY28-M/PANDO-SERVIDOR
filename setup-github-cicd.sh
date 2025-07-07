#!/bin/bash

# Script para preparar GitHub con service account para Cloud Run
# Ejecutar este script para configurar la autenticación

echo "🔐 Configurando GitHub Actions para Cloud Run..."

PROJECT_ID="ascendant-altar-457900-v4"
SERVICE_ACCOUNT_NAME="github-actions-sa"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "📋 Configurando proyecto: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo "🔧 Habilitando APIs necesarias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable iam.googleapis.com

echo "👤 Creando service account para GitHub Actions..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="GitHub Actions Service Account" \
    --description="Service account para CI/CD desde GitHub Actions"

echo "🔑 Asignando roles necesarios..."

# Roles para Cloud Run
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.developer"

# Roles para Container Registry
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"

# Roles para Cloud Build
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudbuild.builds.builder"

# Roles para Secret Manager
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

# Roles para Service Account Token Creator
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountTokenCreator"

echo "🗝️ Generando clave JSON para GitHub..."
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Service account configurado exitosamente!"
echo ""
echo "🔐 CONFIGURAR EN GITHUB:"
echo "1. Ve a tu repositorio: https://github.com/EDY28-M/PANDO"
echo "2. Ve a Settings > Secrets and variables > Actions"
echo "3. Crea un nuevo secret llamado: GCP_SA_KEY"
echo "4. Copia el contenido del archivo github-actions-key.json:"
echo ""
echo "📄 Contenido del archivo:"
cat github-actions-key.json
echo ""
echo ""
echo "⚠️ IMPORTANTE: Elimina el archivo github-actions-key.json después de copiarlo:"
echo "rm github-actions-key.json"
echo ""
echo "🚀 Una vez configurado el secret, puedes hacer push a tu repositorio:"
echo "git add ."
echo "git commit -m \"Add Cloud Run CI/CD configuration\""
echo "git push origin main"
