#!/bin/bash

echo "🚀 Starting Vercel deployment with progress monitoring..."
echo "⏰ $(date)"
echo ""

# Start deployment in background and capture URL
echo "📦 Initiating deployment..."
DEPLOY_OUTPUT=$(vercel --prod --archive=tgz 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | tail -1 | grep -o 'https://[^[:space:]]*')

if [ -z "$DEPLOY_URL" ]; then
  echo "❌ Failed to get deployment URL"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "🔗 Deployment URL: $DEPLOY_URL"
echo "📊 Monitoring progress..."
echo ""

# Monitor progress
./scripts/monitor-deploy.sh "$DEPLOY_URL"