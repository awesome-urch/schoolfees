#!/bin/bash

# School Fees Management Platform - Deployment Script
# This script is triggered by GitHub Actions on push to main branch

set -e

echo "🚀 Starting deployment..."

# Serialize deploys on this server (shared with schoolportal) — a second
# deploy waits up to 30 min instead of running builds concurrently.
exec 9>/var/lock/app-deploy.lock
if ! flock -w 1800 9; then
  echo "❌ Another deployment is still running after 30min. Aborting."
  exit 1
fi

# Navigate to project directory
cd /var/www/schoolfees

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)
CHANGED=$(git diff --name-only "$BEFORE" "$AFTER")

build_backend=false
build_frontend=false

if [ "$BEFORE" != "$AFTER" ]; then
  if echo "$CHANGED" | grep -qE '^(backend/|package(-lock)?\.json)'; then
    build_backend=true
  fi
  if echo "$CHANGED" | grep -qE '^(frontend/|package(-lock)?\.json)'; then
    build_frontend=true
  fi
fi

# Self-heal: never skip a build whose output is missing
if [ ! -f backend/dist/main.js ]; then
  echo "⚠️  backend/dist/main.js missing — forcing backend build"
  build_backend=true
fi
if [ ! -f frontend/.next/BUILD_ID ]; then
  echo "⚠️  frontend/.next/BUILD_ID missing — forcing frontend build"
  build_frontend=true
fi

if [ "$build_backend" = true ]; then
  echo "🔧 Deploying backend..."
  cd /var/www/schoolfees/backend
  echo "📦 Installing backend dependencies..."
  npm install --production=false
  echo "🏗️  Building backend..."
  npm run build
else
  echo "⏭️  No backend changes — skipping backend build"
fi

if [ "$build_frontend" = true ]; then
  echo "🔧 Deploying frontend..."
  cd /var/www/schoolfees/frontend
  echo "📦 Installing frontend dependencies..."
  npm install --production=false
  echo "🏗️  Building frontend..."
  npm run build
else
  echo "⏭️  No frontend changes — skipping frontend build"
fi

# Always restart so .env changes on the server are picked up
echo "🔄 Restarting applications..."
cd /var/www/schoolfees
pm2 restart ecosystem.config.js

# Wait for apps to start
sleep 5

# Check status
echo "✅ Checking application status..."
pm2 status

echo "🎉 Deployment completed successfully!"
