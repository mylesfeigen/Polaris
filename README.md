# Polaris

A two-product website for Polaris, the hunting technology company founded by Myles Feigen and Kenrick Chung. Introduces Echo acoustic detection and Chrono wearable direction as products in development.

## Develop

Requires Node.js 20.19+ or 22.12+ (validated with Node.js 24).

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static hosting provider. Keep the generated route directories: `/` is the landscape-led homepage, `/products/` contains the full rifle interaction study, and `/investors/` contains early-investor information. `/technology/` redirects to the product study. The site uses Vite, HTML, CSS and JavaScript. Three.js loads only on the Products page as its scroll study approaches the viewport; that page's hero plays a pre-rendered MP4. No database or server-side runtime is required.

## Enquiries

Enquiries open the visitor's email application with a prepared message to `info@polarishunting.com`. The homepage form collects an email address and interest choice (early access, investing, both or a general enquiry), plus an optional name and message. Investor contact links preselect Investing. Nothing is submitted until the visitor sends the email. The interface includes a fallback email link. **Confirm the mailbox exists before publishing.** This is not a mailing-list subscription backend.

To override the address, copy `.env.example` to `.env.local` and set `VITE_CONTACT_EMAIL`. This value is public; never place credentials in a `VITE_` variable. Rebuild after changing it.

## Imagery and content

The four-point Polaris mark is prepared from the supplied logo reference in `public/images/polaris-mark.png`. Header and footer use a luminance mask so it inherits the correct colour on light and dark backgrounds. The favicon contains the same mark on black. The POLARIS wordmark is retained.

The homepage uses a generated photorealistic hunter surveying the Australian high country at dusk: `public/images/landscapes/hunter-dusk.jpg`. The hero places the hunter left and the copy right on desktop, with a portrait crop above the copy on mobile. Amber accents connect the controls to the warm dusk light. `forest-light.jpg` is a supporting landscape; `high-country.jpg` and `alpine-lake.jpg` remain available alternatives. Original PNGs are retained alongside the web JPEGs at their native 1672 × 941 resolution. They are illustrative generated scenes, not photographs of identified people or real locations. The latest self-contained review and screenshots are under `/workspace/design-notes/hunter-home/`; workspace HTML links may open as source code in the chat file viewer.

The Products page uses an original **3840 × 2160 rifle rotation**, rendered from our own Three.js exterior illustration with a white studio background. One full revolution takes 60 seconds, at 24 fps. The rifle video contains no stock footage or generative-image/video assets, and is not upscaled. The matching poster is a native 4K frame. See `public/video/SOURCE.md` for provenance. Previous provisional forest footage is archived outside the deployable app, under `/workspace/design-notes/before-rifle-hero/video/`.

To regenerate the loop, start the Vite dev server and run `python scripts/render-rifle.py --url http://127.0.0.1:5173`. This optional export utility requires Python Playwright, `/usr/bin/chromium` and ffmpeg; none is needed to run or deploy the website. `--preview` exports sample angles first. `scripts/rifle-studio.js` controls lighting, framing and rotation; the script streams native-resolution frames directly to the video encoder.

Echo and Chrono remain the only products. Hardware designs, trained models, R&D datasets and detection performance are development plans, not validated claims. Manrope is self-hosted under the SIL Open Font License (`public/fonts/OFL.txt`).

## Design directions

The `/concepts/` route is a side-by-side decision aid for three alternative homepage directions: Field signal, Acoustic studio and After dark. Choose a direction using the controls at the top. A `?direction=field`, `?direction=studio`, or `?direction=horizon` URL opens a specific option. The abstract field diagram illustrates a deer call, Echo and Chrono; it uses simulated values and does not claim live detection or tested performance. The three source buttons, direction controls, motion toggle and reduced-motion preference work with a keyboard. This route uses CSS/SVG art rather than AI-generated hero imagery. It links back to the existing Technology page and interest form. The existing homepage remains available.

## Integrated technology reveal

Technology is part of the Products page at `/products/#technology`. The old `/technology/` route redirects there. The landscape-led homepage introduces the mission, hunting problem, Echo/Chrono solution, investors, early users and contact form. The previous white page is preserved outside the app under `/workspace/design-notes/before-forest-reset/`.

The Products page has an intelligence introduction at `/products/#system`: two short paragraphs on black, with words moving from grey to white in reading order as the visitor scrolls. `src/text-reveal.js` follows the copy as it moves freely through the viewport, with no pinned stage or extended scroll space. Words fade in reading order from grey to white between the copy entering near the bottom of the screen and its final line reaching the upper third; scrolling back reverses the fade. The section uses natural document flow, including short viewports. Reduced motion and disabled JavaScript show readable white text. The typography uses a Helvetica/Arial stack to approximate the supplied Neuralink recording; the exact Neuralink font could not be verified. The copy describes development plans, without claiming completed training or a validated dataset.

The Neuralink-style interaction uses a pinned 3D stage: the exterior rifle is introduced, focuses on the scope/barrel/stock, then reassembles into a final view without text. There is no separate Components step. Scroll position controls both part transforms and camera zoom/target, in both directions. No wheel or touch events are intercepted. Plain part names and short descriptions accompany a vertical rail of five unnumbered bars. The bars support clicking, keyboard activation, Up/Down and Home/End; a skip link bypasses the sequence. Reduced motion defaults to still views with manual selection. The camera and part transforms follow native scroll with 160 ms damping and eased transitions; captions follow the rendered view. Text uses 140 ms damping with overlapping word fades. Animation frames stop once settled or offscreen, and Three.js loads when the section approaches the viewport. A local SVG is available when WebGL or JavaScript is unavailable.

The component headings, text widths and pill controls follow measurements from the supplied Neuralink recording: 80 px maximum component headings, 36 px desktop navigation buttons and 68 px primary buttons. Responsive sizes adapt on smaller screens. The exact reference font and live CSS remain unverified.

On Products, the old technology teaser and founder section are removed. A black registration section states the Polaris goal, with grey supporting text, white headings and a compact email/interest form.

The Products hero contains only the rifle animation beneath the navigation. Click or tap the rifle area to pause/resume, or focus it with the keyboard and press Space. The control has an accessible name without a visible icon or label. The previous hero headings, promotional copy, footer text and numbered study captions are removed.

`src/rifle-model.js` contains the nonfunctional exterior illustration in arbitrary scene units. `src/scroll-reveal.js` contains the named part groups and animation poses. To adapt this to Echo/Chrono later, load a grouped GLB, retain stable group names/centres and update the poses/captions. This demonstration does not represent an approved Polaris product or an engineering/assembly model.

The muted original hero loop supports pause/play and pauses offscreen/in background tabs. Reduced-motion and save-data preferences show the matching still without requesting the MP4; explicit play starts the download. Narrow screens use a 2.6 MB, full-length 1080p compatibility rendition; desktop uses the native 4K master. A failed or stalled 4K request automatically falls back to HD. If both fail, an independent poster stays visible and an enabled retry control can recover without a page reload. Future renders replace the public MP4 only when encoding has finished. The interest form still prepares an email and does not submit to a backend. Nothing has been published.

Build assets use relative URLs, so the site can be mounted under a nested preview path. A failed interactive-animation import collapses to usable still views with captions and a reload control, rather than leaving several screens of empty space. Self-contained review files live under `/workspace/design-notes/rifle-studio/`: `animation-preview.html` contains a compact 15-second clip and native controls; `polaris-preview.html` contains the complete page and full HD loop. These are review artifacts, not a published site.

Regenerate the complete self-contained review with `node scripts/build-preview.mjs`. An optional output filename can be supplied as the first argument. The utility embeds Home, Products and Investors as isolated documents in one review file, with working navigation, Back/Forward, form queries and anchor links. Shared fonts, images and the full HD loop are embedded once; the deployed Products page retains its original 4K video and HD fallback. The latest review is `/workspace/design-notes/landscape-home/polaris-landscape-preview.html`.

## Validation

The production build passes. The latest checks cover Home, Products and Investors, layouts from 320 to 1920 px, mobile navigation, email validation, all four homepage interest choices, optional name/message fields, and investor interest preselection. The self-contained preview checks cover navigation, Back/Forward, the full rifle sequence, and operation without external requests. Reports and screenshots are saved in `/workspace/design-notes/landscape-home/`. Earlier animation checks confirm damped forward/reverse progress, exact settled poses, synchronized captions and no continuing frames while idle or offscreen.

Chromium checks verify native-4K playback, the 60-second loop boundary, pause/resume, offscreen suspension, reduced motion, save-data behavior, video-error fallback, responsive layouts from 320 to 1920 pixels, mobile navigation, the scroll poses in both directions, keyboard still views, the legacy route, enquiry handling and WebGL fallback. Additional loading checks verify a nested preview path, automatic 4K-to-HD recovery, retry after both videos fail, direct HD loading on phones, and failed-code fallback. The MP4 contains exactly 1,440 frames at 24 fps and no audio track. Reports and screenshots are saved in `/workspace/design-notes/rifle-studio/`. These checks cover the local browser and simulated preview paths; the chat preview panel itself is not directly accessible to this environment. No enquiries were sent by the checks.


Use the existing checkout in this isolated cloud environment; a separate Git worktree is not needed. Run `npm run dev -- --port 5173` to start the development server in a new session. Running processes do not survive an environment snapshot.
