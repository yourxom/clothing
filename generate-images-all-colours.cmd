@echo off
title AURELIA — Generating ALL colourway images
echo.
echo ============================================================
echo  AURELIA Product Image Generator — ALL COLOURWAYS
echo  This generates one image per product per colour variant.
echo  ~150-200 images total. Takes 30-60 minutes.
echo  Resumable — press Ctrl+C to stop, re-run to continue.
echo ============================================================
echo.

cd /d "%~dp0"
node scripts\generate-product-images.cjs --all-colours

echo.
echo Done. Check public\products\ for the generated images.
pause
