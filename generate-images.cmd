@echo off
title AURELIA — Generating product images (FLUX.1-schnell)
echo.
echo ============================================================
echo  AURELIA Product Image Generator
echo  Model: FLUX.1-schnell via Hugging Face (nscale)
echo  This will generate images for all published products.
echo  Already-generated images are skipped (resumable).
echo  Press Ctrl+C at any time to stop — re-run to continue.
echo ============================================================
echo.

cd /d "%~dp0"
node scripts\generate-product-images.cjs

echo.
echo Done. Check public\products\ for the generated images.
pause
