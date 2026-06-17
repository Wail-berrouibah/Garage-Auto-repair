#!/usr/bin/env bash
set -euo pipefail

echo "=== Mechanica Production Setup ==="
echo ""

if [ ! -f .env.production ]; then
  echo "ERROR: .env.production not found"
  echo "Copy .env.production.example to .env.production and fill in your values"
  exit 1
fi

echo "1. Installing dependencies..."
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

echo "2. Generating Prisma client..."
cd backend && npx prisma generate && cd ..

echo "3. Building backend..."
cd backend && npm run build && cd ..

echo "4. Building frontend..."
cd frontend && npm run build && cd ..

echo ""
echo "=== Setup complete! ==="
echo "To start the production server:"
echo "  cd backend && NODE_ENV=production node dist/main"
echo "  cd frontend && NODE_ENV=production node .next/standalone/server.js"
echo ""
echo "Or use Docker: docker compose -f docker-compose.yml up --build -d"
