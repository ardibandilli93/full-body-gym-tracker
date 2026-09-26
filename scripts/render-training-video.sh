#!/usr/bin/env bash
set -euo pipefail
# Rebuild the lightweight, pre-rendered hero video from the source artwork.
cd "$(dirname "$0")/.."
mkdir -p public/assets/training
cp art/training/guard.jpg public/assets/training/poster.jpg
ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -framerate 24 -t 2 -i art/training/guard.jpg \
  -loop 1 -framerate 24 -t 2 -i art/training/squat.jpg \
  -loop 1 -framerate 24 -t 2 -i art/training/guard.jpg \
  -loop 1 -framerate 24 -t 2 -i art/training/left-jab.jpg \
  -loop 1 -framerate 24 -t 2 -i art/training/right-jab.jpg \
  -loop 1 -framerate 24 -t 2 -i art/training/guard.jpg \
  -filter_complex "\
    [0:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v0];\
    [1:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v1];\
    [2:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v2];\
    [3:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v3];\
    [4:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v4];\
    [5:v]zoompan=z='min(zoom+0.0007,1.04)':d=1:s=960x540:fps=24,format=yuv420p[v5];\
    [v0][v1]xfade=transition=fade:duration=0.4:offset=1.6[x1];\
    [x1][v2]xfade=transition=fade:duration=0.4:offset=3.2[x2];\
    [x2][v3]xfade=transition=fade:duration=0.4:offset=4.8[x3];\
    [x3][v4]xfade=transition=fade:duration=0.4:offset=6.4[x4];\
    [x4][v5]xfade=transition=fade:duration=0.4:offset=8.0[out]" \
  -map '[out]' -an -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart \
  public/assets/training/duo.mp4
