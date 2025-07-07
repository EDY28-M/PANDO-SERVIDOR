#!/bin/bash

# Script para configurar Google Secret Manager
# Ejecutar este script ANTES de configurar GitHub Actions

echo "🔐 Configurando Google Secret Manager para PANDO..."

PROJECT_ID="ascendant-altar-457900-v4"

echo "📋 Configurando proyecto: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo "🔧 Habilitando APIs necesarias..."
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo "🔑 Creando secrets en Secret Manager..."

# Crear secret para password de base de datos
echo -n "Junior.28" | gcloud secrets create db-password --data-file=-

# Crear secret para Gmail user
echo -n "keraaigpt.plus@gmail.com" | gcloud secrets create gmail-user --data-file=-

# Crear secret para Gmail password
echo -n "tnev ssds hcpx evrw" | gcloud secrets create gmail-pass --data-file=-

# Crear secret para session secret
echo -n "kera-ai-secret-key-2024" | gcloud secrets create session-secret --data-file=-

echo "🎯 Configurando permisos para Cloud Run..."

# Obtener el número del proyecto
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Dar permisos a Cloud Run para acceder a los secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Dar permisos a Cloud Build
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/run.developer"

echo "✅ Secrets creados exitosamente:"
gcloud secrets list

echo ""
echo "🔐 SIGUIENTE PASO - CONFIGURAR GITHUB:"
echo "1. Ve a tu repositorio GitHub: https://github.com/EDY28-M/PANDO"
echo "2. Ve a Settings > Secrets and variables > Actions"
echo "3. Crea el secret GCP_SA_KEY con el contenido del service account key"
echo ""
echo "📋 Para obtener el service account key, ejecuta:"
echo "gcloud iam service-accounts create github-actions-sa --display-name=\"GitHub Actions Service Account\""
echo "gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/run.developer\""
echo "gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/storage.admin\""
echo "gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/secretmanager.secretAccessor\""
echo "gcloud iam service-accounts keys create key.json --iam-account=github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
echo "📝 Copia el contenido de key.json como secret GCP_SA_KEY en GitHub"
