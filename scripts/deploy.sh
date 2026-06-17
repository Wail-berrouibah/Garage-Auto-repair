#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
COMPOSE_FILE="docker-compose.yml"

echo "=== Deploying Mechanica ($ENVIRONMENT) ==="

if [ "$ENVIRONMENT" = "local" ]; then
  echo "Starting local environment..."
  docker compose -f "$COMPOSE_FILE" up --build -d
  echo "Done. Services:"
  echo "  Frontend: http://localhost:3000"
  echo "  API:      http://localhost:4000"
  echo "  MinIO:    http://localhost:9001"
  echo "  MailHog:  http://localhost:8025"
  exit 0
fi

if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "production" ]; then
  echo "Deploying to AWS ECS ($ENVIRONMENT)..."
  echo "  Cluster: mechanica-$ENVIRONMENT"
  echo "  Task:    mechanica-api"

  aws ecs update-service \
    --cluster "mechanica-$ENVIRONMENT" \
    --service "mechanica-$ENVIRONMENT-api" \
    --force-new-deployment \
    --no-cli-pager

  echo "Deployment triggered. Monitoring roll-out..."
  aws ecs wait services-stable \
    --cluster "mechanica-$ENVIRONMENT" \
    --services "mechanica-$ENVIRONMENT-api"

  echo "Deployment complete."
  exit 0
fi

echo "Usage: $0 [local|staging|production]"
exit 1
