"""Render our original exterior illustration to a seamless, native 4K MP4.

Requires the Vite dev server, Python Playwright, Chromium, and ffmpeg.
Run: python scripts/render-rifle.py --url http://127.0.0.1:5173
Use --preview to render a few still angles before the full 60-second export.
"""
import argparse
import asyncio
import base64
import subprocess
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:5173')
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[1] / 'public/video'
    output.mkdir(parents=True, exist_ok=True)
    width, height, fps, seconds = 3840, 2160, 24, 60
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/chromium', args=[
            '--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
        ])
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        await page.route('**/render-studio', lambda route: route.fulfill(
            content_type='text/html', body='<!doctype html><html><body></body></html>'))
        await page.goto(args.url + '/render-studio')
        await page.evaluate('''async ({width,height}) => {
            const {createStudio} = await import('/scripts/rifle-studio.js');
            window.studio = createStudio(width, height);
        }''', {'width': width, 'height': height})
        async def frame(turn):
            return base64.b64decode(await page.evaluate('t => studio.frame(t)', turn))
        if args.preview:
            for i, turn in enumerate([0, .125, .25, .5, .75]):
                data = await frame(turn)
                Path(f'/tmp/rifle-studio-{i}.jpg').write_bytes(data)
                if i == 0:
                    (output / 'rifle-poster.jpg').write_bytes(data)
            print('Preview frames rendered at 3840 × 2160.', flush=True)
        else:
            # Stream native-resolution frames directly into the encoder: no
            # upscaling, optical-flow interpolation or artificial motion blur.
            # Keep unfinished MP4 data outside the live public path. Only a
            # complete, playable file replaces the version served to visitors.
            staging = tempfile.TemporaryDirectory(prefix='.rifle-render-', dir=output.parent.parent)
            movie = Path(staging.name) / 'rifle-rotation-4k.mp4'
            process = subprocess.Popen([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                '-f', 'image2pipe', '-framerate', str(fps), '-vcodec', 'mjpeg', '-i', '-',
                '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                '-metadata', 'title=Polaris — original rifle motion study',
                '-metadata', 'comment=Original exterior illustration. One full turn in 60 seconds.',
                str(movie),
            ], stdin=subprocess.PIPE)
            try:
                for i in range(fps * seconds):
                    data = await frame(i / (fps * seconds))
                    if i == 0:
                        (output / 'rifle-poster.jpg').write_bytes(data)
                    process.stdin.write(data)
                    if i % 120 == 0:
                        print(f'Rendered {i}/{fps * seconds} frames', flush=True)
                process.stdin.close()
                if process.wait() != 0:
                    raise RuntimeError('ffmpeg failed')
                movie.replace(output / 'rifle-rotation-4k.mp4')
            except BaseException:
                process.kill()
                process.wait()
                raise
            finally:
                staging.cleanup()
            print('Saved native 4K, 24 fps, 60-second loop.', flush=True)
        await browser.close()

asyncio.run(main())
