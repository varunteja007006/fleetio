#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Ensure legacy packaging is on for APK builds
if grep -q 'expo.useLegacyPackaging=false' android/gradle.properties; then
  sed -i 's/expo.useLegacyPackaging=false/expo.useLegacyPackaging=true/' android/gradle.properties
  echo "✓ Set expo.useLegacyPackaging=true"
fi

echo "→ Building release APK..."
cd android && ./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  cp "$APK" ../fleetio.apk
  echo ""
  echo "✓ APK ready: $(pwd)/../fleetio.apk ($(du -h "$APK" | cut -f1))"
  echo ""
  echo "Install via ADB: adb install ../fleetio.apk"
  echo "Or copy the file to your phone and open it."
else
  echo "✗ Build failed — APK not found"
  exit 1
fi
