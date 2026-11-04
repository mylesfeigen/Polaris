import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// One portable review, independent documents, and media stored once.
const root = fileURLToPath(new URL('../', import.meta.url));
const previewPath = path.resolve(process.argv[2] || path.join(root, '../design-notes/rifle-studio/polaris-preview.html'));
const mime = { '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif', '.ttf':'font/ttf', '.woff':'font/woff', '.woff2':'font/woff2', '.mp4':'video/mp4' };
const assets = {}, assetFiles = new Map();
const origin = 'https://polaris-preview.local';
const routes = { '/':'index.html', '/products/':'products/index.html', '/investors/':'investors/index.html' };
function resolvePublic(source, route='/') {
  const url = new URL(source, origin + route);
  if (url.origin !== origin) throw new Error(`External asset: ${source}`);
  return path.join(root, url.pathname.startsWith('/src/') ? '' : 'public', decodeURIComponent(url.pathname));
}
async function asset(file) {
  file = path.resolve(file);
  if (!assetFiles.has(file)) {
    const type = mime[path.extname(file).toLowerCase()];
    if (!type) throw new Error(`Unknown media type: ${file}`);
    const token = `__POLARIS_ASSET_${assetFiles.size}__`;
    assets[token] = `data:${type};base64,${(await fs.readFile(file)).toString('base64')}`;
    assetFiles.set(file, token);
  }
  return assetFiles.get(file);
}
async function inlineCSS(file, seen=new Set()) {
  file = path.resolve(file);
  if (seen.has(file)) return '';
  seen.add(file);
  let css = await fs.readFile(file, 'utf8');
  const localPath = source => source.startsWith('/') ? resolvePublic(source) : path.resolve(path.dirname(file), source);
  for (const match of [...css.matchAll(/@import\s+(?:url\(\s*)?['"]?([^'"\s;)]+)['"]?\s*\)?\s*;/g)]) css = css.replace(match[0], await inlineCSS(localPath(match[1]), seen));
  for (const match of [...css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)]) {
    if (/^(?:data:|#|__POLARIS_ASSET_)/.test(match[1])) continue;
    css = css.replaceAll(match[0], `url('${await asset(localPath(match[1]))}')`);
  }
  return css;
}
async function bundle(entry) {
  const result = await build({ configFile:false, root, base:'./', logLevel:'warn', build:{ write:false, minify:'esbuild', assetsInlineLimit:Infinity, lib:{entry,name:'PolarisReview',formats:['iife']}, rollupOptions:{output:{inlineDynamicImports:true}} } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(value => value.output);
  const chunks = outputs.filter(value => value.type === 'chunk');
  if (chunks.length !== 1) throw new Error(`Expected one script for ${entry}`);
  if (outputs.some(value => value.type === 'asset' && value.fileName.endsWith('.css'))) throw new Error('Preview styles must be linked from HTML, not imported from JS.');
  return chunks[0].code.replace(/<\/script/gi, '<\\/script');
}
// Internal links navigate the review; external and mailto links retain browser behaviour.
function pageBridge() {
  const base = new URL(window.__POLARIS_PREVIEW_URL);
  const allowed = new Set(['/', '/products/', '/investors/']);
  function normalise(url) {
    if (url.pathname === '/technology/' || url.pathname === '/technology/index.html') { url.pathname='/products/'; url.hash ||= '#technology'; }
    url.pathname = url.pathname.replace(/index\.html$/, '');
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (!href || /^(?:mailto:|tel:|data:|javascript:)/i.test(href)) return;
    const target = normalise(new URL(href, base));
    if (target.origin !== base.origin || !allowed.has(target.pathname)) return;
    event.preventDefault();
    if (target.pathname === base.pathname && target.search === base.search) {
      const id = decodeURIComponent(target.hash.slice(1));
      (id ? document.getElementById(id) : document.documentElement)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
      return;
    }
    parent.postMessage({type:'polaris-preview-navigate',route:target.pathname+target.search+target.hash}, '*');
  });
  function restoreTarget() {
    if (base.hash) document.getElementById(decodeURIComponent(base.hash.slice(1)))?.scrollIntoView({block:'start',behavior:'instant'});
  }
  addEventListener('load', () => { restoreTarget(); document.fonts?.ready.then(restoreTarget); parent.postMessage({type:'polaris-preview-ready',title:document.title}, '*'); });
}
async function pageHTML(route, sourceFile) {
  let html = await fs.readFile(path.join(root, sourceFile), 'utf8');
  const seenCSS = new Set();
  for (const match of [...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/g)]) {
    const css = await inlineCSS(resolvePublic(match[1], route), seenCSS);
    html = html.replace(match[0], () => `<style>${css}</style>`);
  }
  html = html.replace(/\s*<link\b[^>]*\brel=["'](?:preload|modulepreload)["'][^>]*>/g, '');
  html = html.replace(/(<video[^>]+)\s+poster="[^"]+"/g, '$1').replace(/\s+data-fallback-src="[^"]+"/g, '');
  html = html.replace(/data-src="[^"\n]*rifle-rotation[^"\n]+"/g, `data-src="${await asset(path.join(root,'public/video/rifle-rotation-hd.mp4'))}"`);
  for (const match of [...html.matchAll(/(["'])([^"'<>\s]+\.(?:svg|png|jpe?g|webp|avif|mp4))\1/gi)]) {
    if (/^(?:data:|__POLARIS_ASSET_)/.test(match[2])) continue;
    html = html.replaceAll(match[0], `${match[1]}${await asset(resolvePublic(match[2], route))}${match[1]}`);
  }
  for (const match of [...html.matchAll(/<script\b(?=[^>]*\btype=["']module["'])[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/g)]) {
    const code = await bundle(resolvePublic(match[1], route));
    html = html.replace(match[0], () => `<script>(()=>{const v=document.querySelector('#hero-film');if(v)v.dataset.fallbackSrc=v.dataset.src})();${code}</script>`);
  }
  html = html.replace(/<head>/i, '<head><script>window.__POLARIS_PREVIEW_URL=__POLARIS_PAGE_URL__;</script>');
  html = html.replace(/<\/body>/i, () => `<script>(${pageBridge.toString()})();</script></body>`);
  const externalCode = html.match(/<(?:script|link)\b[^>]+(?:src|href)=["'](?:\.?\/|https?:)[^>]+>/g);
  if (externalCode) throw new Error(`External code remains in ${route}: ${externalCode.join('\n')}`);
  return html;
}
const pages = {};
for (const [route, source] of Object.entries(routes)) pages[route] = await pageHTML(route, source);

function previewRuntime() {
  const payload = JSON.parse(document.getElementById('polaris-pages').textContent);
  const frame = document.getElementById('page'), status = document.getElementById('preview-status');
  const origin = 'https://polaris-preview.local';
  let timer;
  function routeFromHash() { try { return decodeURIComponent(location.hash.slice(1)) || '/'; } catch { return '/'; } }
  function render() {
    const url = new URL(routeFromHash(), origin);
    if (url.origin !== origin || !payload.pages[url.pathname]) { status.hidden=false; status.textContent='That page is not included in this preview. Use Home below.'; frame.style.display='none'; return; }
    frame.style.display='block';
    clearTimeout(timer); frame.hidden=false; status.hidden=false; status.textContent='Loading Polaris…';
    frame.srcdoc = payload.pages[url.pathname].replace('__POLARIS_PAGE_URL__', JSON.stringify(url.href).replace(/</g,'\\u003c')).replace(/__POLARIS_ASSET_\d+__/g,token=>payload.assets[token]);
    timer = setTimeout(() => { status.textContent='The page is taking longer to load. Open Home below to try again.'; }, 20000);
  }
  addEventListener('message', event => {
    if (event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'polaris-preview-ready') { clearTimeout(timer); status.hidden=true; if (typeof event.data.title==='string') document.title=event.data.title; }
    else if (event.data.type === 'polaris-preview-navigate' && typeof event.data.route==='string') {
      const url = new URL(event.data.route,origin);
      if (url.origin===origin && payload.pages[url.pathname]) location.hash=encodeURIComponent(url.pathname+url.search+url.hash);
    }
  });
  addEventListener('hashchange', render); render();
}
const payload = JSON.stringify({pages,assets}).replace(/</g,'\\u003c');
const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Polaris — Site preview</title><style>html,body{margin:0;width:100%;height:100%;background:#111}#page{display:block;width:100%;height:100%;border:0}#preview-status{position:fixed;inset:auto 16px 16px;z-index:3;margin:0;padding:14px 18px;background:#171717;color:#fff;font:14px Arial,sans-serif;border-radius:8px}#preview-status[hidden]{display:none}.recovery{position:fixed;bottom:18px;right:24px;color:#fff;z-index:4;font:14px Arial,sans-serif}body:has(#preview-status[hidden]) .recovery{display:none}</style></head><body><p id="preview-status" role="status">Loading Polaris…</p><a class="recovery" href="#%2F">Home</a><iframe id="page" title="Polaris website preview" allow="autoplay; fullscreen"></iframe><script id="polaris-pages" type="application/json">${payload}</script><script>(${previewRuntime.toString()})();</script></body></html>`;
await fs.mkdir(path.dirname(previewPath), {recursive:true});
await fs.writeFile(`${previewPath}.tmp`,html,{mode:0o644});
await fs.rename(`${previewPath}.tmp`,previewPath);
await fs.chmod(previewPath,0o644);
console.log(JSON.stringify({previewPath,bytes:Buffer.byteLength(html),routes:Object.keys(pages),embeddedAssets:assetFiles.size}));
