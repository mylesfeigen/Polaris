# Original Polaris rifle motion study

`rifle-rotation-4k.mp4` is rendered locally from the original Three.js exterior
illustration in `src/rifle-model.js`. It contains no stock footage, downloaded
rifle model, Neuralink asset, or generative-image/video output.

- Native frame size: 3840 × 2160. No upscaling.
- Loop: one complete turn in 60 seconds at 24 frames per second.
- Silent H.264 MP4, with fast-start metadata for browser playback.
- `rifle-poster.jpg`: the matching first frame at native 4K resolution.
- `rifle-rotation-hd.mp4`: the same complete loop downsampled to 1920 × 1080,
  H.264 High Level 4.0, limited-range yuv420p, 24 fps, silent and fast-start.
  Used on narrow screens and when the 4K source cannot play; it is not a new render.
- Studio scene and lighting: `scripts/rifle-studio.js`.
- Reproducible exporter: `scripts/render-rifle.py`.

The rifle is a nonfunctional exterior illustration in arbitrary scene units,
used to explore the motion and presentation of future Echo and Chrono designs.
It is not a Polaris product, an approved hardware design or an engineering model.

The previous provisional forest footage and its source notes are archived
outside the deployable app in `/workspace/design-notes/before-rifle-hero/video/`.

Future exports are encoded in a temporary directory and replace the public MP4
only after completion, so the running preview cannot serve an unfinished file.
