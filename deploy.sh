#!/usr/bin/env bash
set -euo pipefail

# Build and export the Next.js site into the docs/ folder for GitHub Pages
cd "$(dirname "$0")/ciel-encryption"
npm install
npm run build
npm run export

echo "✅ Site built and exported to docs/"
