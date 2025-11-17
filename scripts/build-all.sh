#!/bin/bash
# Build script for UI and backend

set -e

echo "Building UI..."
npm run build:ui

echo "Building backend..."
npm run build

echo "Build complete!"
echo "UI files in: dist/ui/"
echo "Backend files in: dist/"
