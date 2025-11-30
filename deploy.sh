#!/bin/bash

# School Fees Management Platform - Deployment Script
# This script is triggered by GitHub Actions on push to main branch

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/schoolfees

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd /var/www/schoolfees/backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install --production=false

# Build backend
echo "🏗️  Building backend..."
npm run build

# Frontend deployment
echo "🔧 Deploying frontend..."
cd /var/www/schoolfees/frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install --production=false

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Restart applications with PM2
echo "🔄 Restarting applications..."
cd /var/www/schoolfees
pm2 restart ecosystem.config.js

# Wait for apps to start
sleep 5

# Check status
echo "✅ Checking application status..."
pm2 status

echo "🎉 Deployment completed successfully!"
