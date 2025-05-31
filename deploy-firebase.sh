#!/bin/bash

set -e

echo "Building Vue app for production..."
npm run build

echo "Deploying to Firebase Hosting..."
firebase deploy

echo "Deployment complete!"