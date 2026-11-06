# Dokona China Mission – animated route map

Source for `output/Dokona_China_Mission_Route_*.mp4`.

- `index.html` – Three.js globe animation; `renderAt(t)` draws the frame at time t (seconds). Open via a local server to preview live.
- `cap.js` / `runall.sh` – frame-by-frame capture with Playwright, encoded by ffmpeg (4K = deviceScaleFactor 2).
- `music.py` – synthesizes the soundtrack (`music.wav`).
- `china_prov.json` – China province outlines (decoded from the echarts 4.9.0 map data).

Setup: `npm install`, then `python3 -m http.server 8765` in this folder, then `./runall.sh`.
Join the segments and the music with ffmpeg (concat demuxer + `-i music.wav`).
