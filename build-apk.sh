#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-dev}"
case "$MODE" in
  dev)  ENV_FILE=".env.local" ;;
  prod) ENV_FILE=".env.production" ;;
  *)
    echo "Usage: ./build-apk.sh [dev|prod]" >&2
    exit 1
    ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE not found — copy .env.example to $ENV_FILE first" >&2
  exit 1
fi

# Bake the chosen env file into the JS bundle (EXPO_PUBLIC_* vars)
set -a
. "$ENV_FILE"
set +a

if [ "$MODE" = "prod" ]; then
  echo "→ Deploying Convex backend to production..."
  npx convex deploy
fi

# Ensure legacy packaging is on for APK builds
if grep -q 'expo.useLegacyPackaging=false' android/gradle.properties; then
  sed -i 's/expo.useLegacyPackaging=false/expo.useLegacyPackaging=true/' android/gradle.properties
  echo "✓ Set expo.useLegacyPackaging=true"
fi

# Stop the Gradle daemon so stale env vars aren't frozen into the build
cd android
./gradlew --stop

echo "→ Building release APK ($MODE)..."
./gradlew assembleRelease --no-daemon
cd ..

APK="android/app/build/outputs/apk/release/app-release.apk"
OUT="fleetio.$MODE.apk"
if [ -f "$APK" ]; then
  cp "$APK" "$OUT"
  echo ""
  echo "✓ APK ready: $OUT ($(du -h "$APK" | cut -f1))"
  echo ""
  echo "Install via ADB: adb install $OUT"
  echo "Or copy the file to your phone and open it."
else
  echo "✗ Build failed — APK not found"
  exit 1
fi