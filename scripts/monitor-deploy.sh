#!/bin/bash

# Monitor Vercel deployment status
# Usage: ./scripts/monitor-deploy.sh [deployment-url]

DEPLOYMENT_URL=${1:-$(vercel ls | head -1)}
echo "🚀 Monitoring deployment: $DEPLOYMENT_URL"
echo "⏰ Started at: $(date)"
echo ""

# Check every 30 seconds
while true; do
  STATUS=$(vercel ls | grep "$DEPLOYMENT_URL" | awk '{print $4}')
  TIMESTAMP=$(date +"%H:%M:%S")
  
  case $STATUS in
    "●" | "Queued")
      echo "[$TIMESTAMP] ⏸️  Queued - waiting for build slot..."
      ;;
    "Building")
      echo "[$TIMESTAMP] 🔨 Building - compiling code..."
      ;;
    "Ready")
      echo "[$TIMESTAMP] ✅ Ready - deployment complete!"
      echo "🎉 Deployment successful: $DEPLOYMENT_URL"
      break
      ;;
    "Error")
      echo "[$TIMESTAMP] ❌ Error - deployment failed"
      echo "🔍 Check logs: vercel logs $DEPLOYMENT_URL"
      break
      ;;
    *)
      echo "[$TIMESTAMP] 📊 Status: $STATUS"
      ;;
  esac
  
  sleep 30
done