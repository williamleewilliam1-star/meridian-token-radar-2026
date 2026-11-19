#!/usr/bin/env bash
set -euo pipefail
# Run after: RADAR_INPUT=../token-radar-01-kit/input RADAR_OUTPUT=out node --experimental-strip-types main.ts
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGE="file://$ROOT/out/dashboard/index.html"
cd "$ROOT"
mkdir -p "$ROOT/screenshots" "$ROOT/out/dashboard"
node --input-type=module --experimental-strip-types -e "import{readFileSync,writeFileSync}from'node:fs';import{buildRadar,parseSnapshot,dataScript}from'./lib/model.ts';const s=parseSnapshot(readFileSync('../token-radar-01-kit/input/snapshot.json','utf8'));writeFileSync('out/data.js',dataScript(buildRadar(s).radar))"
cp dashboard/* out/dashboard/
for spec in '1-board.png|' '2-detail.png|#protocol=steakhouse-financial&tab=plan' '3-filtered.png|#category=Lending'; do
  name="${spec%%|*}"; suffix="${spec#*|}"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --allow-file-access-from-files --hide-scrollbars --force-device-scale-factor=1 --window-size=1400,900 --virtual-time-budget=2500 --user-data-dir="/private/tmp/meridian-$name-$$" --screenshot="$ROOT/screenshots/$name" "$PAGE$suffix"
done
for image in "$ROOT"/screenshots/*.png; do
  bytes="$(stat -f %z "$image")"
  if [ "$bytes" -gt 524288 ]; then echo "Screenshot exceeds 512 KiB: $image ($bytes bytes)" >&2; exit 1; fi
  sips -g pixelWidth -g pixelHeight "$image"
done
RADAR_INPUT="$ROOT/../token-radar-01-kit/input" RADAR_OUTPUT="$ROOT/out" node --experimental-strip-types "$ROOT/main.ts"
