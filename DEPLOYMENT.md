# Polaris preview hosting

The landing page is `/`. Its Shop link opens `/products/`, restored from the
user-selected `/workspace/design-notes/rifle-studio/polaris-free-scroll-preview.html`.
The saved rifle experience is preserved, with updated site navigation and an
explicit Back to home link.
Invest opens `/investors/`. Early Access and Register Interest reach `/#register`.

The site is ready for a static host. `netlify.toml` sets the build command to
`npm run build` and output directory to `dist`.

## Netlify settings

1. In Netlify, import `mylesfeigen/Polaris` from GitHub.
2. Select the `polaris-site-preview` branch once it is available on GitHub.
3. Leave the base directory empty. Build command: `npm run build`.
   Publish directory: `dist`. These settings are also in `netlify.toml`.
4. Start the deployment. Netlify provides an HTTPS URL after the build succeeds.

The user connected this branch to Netlify. The stable site address is
`https://tangerine-nasturtium-ea7810.netlify.app/`. URLs with a deployment ID before
`--tangerine-nasturtium-ea7810.netlify.app` are fixed snapshots and do not show later
updates. Pushes to the configured branch can trigger Netlify builds; confirm the
latest build in Netlify's deployment dashboard.
Workspace HTML and image links are not a reliable preview in this chat client.
The registration form prepares an email draft; it does not save submissions to a
database or send email automatically.
