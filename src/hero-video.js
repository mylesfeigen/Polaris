const video = document.querySelector('#hero-film');
const button = document.querySelector('#motion-toggle');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const sources = [video.dataset.src, video.dataset.fallbackSrc];
// Keep the native 4K master on desktop; narrow screens get the same animation
// in a smaller, widely supported H.264 rendition.
const preferHD = matchMedia('(max-width: 700px)').matches || Boolean(navigator.connection?.saveData);
let sourceIndex = preferHD ? 1 : 0;
let paused = preference.matches || Boolean(navigator.connection?.saveData);
let inView = false;
let state = 'idle';
let generation = 0;
let handledFailure = -1;
let timer;

function labels() {
  const retry = state === 'error';
  button.disabled = false;
  const action = retry ? 'Retry rifle rotation' : paused ? 'Play rifle rotation' : 'Pause rifle rotation';
  button.setAttribute('aria-label', action);
  document.body.classList.toggle('motion-paused', paused || retry);
  video.dataset.playback = state;
}

function loadSource() {
  generation += 1;
  state = 'loading';
  video.classList.remove('is-ready');
  video.src = new URL(sources[sourceIndex], document.baseURI).href;
  video.load();
  labels();
}

function failed(attempt) {
  if (attempt !== generation || handledFailure === attempt) return;
  handledFailure = attempt;
  clearTimeout(timer);
  video.classList.remove('is-ready');
  video.pause();
  if (sourceIndex === 0) {
    sourceIndex = 1;
    state = 'idle';
    sync();
  } else {
    state = 'error';
    paused = true;
    video.removeAttribute('src');
    video.load();
    labels();
  }
}

function sync() {
  clearTimeout(timer);
  labels();
  if (paused || !inView || document.hidden || state === 'error') {
    video.pause();
    return;
  }
  if (state === 'idle') loadSource();
  const attempt = generation;
  // A stalled request should not leave an invisible, permanently disabled hero.
  if (video.readyState < 2) timer = setTimeout(() => failed(attempt), 20000);
  video.play().catch(error => {
    if (attempt !== generation || error.name === 'AbortError') return;
    if (error.name === 'NotAllowedError') {
      paused = true;
      clearTimeout(timer);
      labels();
    } else failed(attempt);
  });
}

button.addEventListener('click', () => {
  if (state === 'error') { state = 'idle'; paused = false; }
  else paused = !paused;
  sync();
});
video.addEventListener('loadeddata', () => {
  clearTimeout(timer);
  state = 'ready';
  video.classList.add('is-ready');
  labels();
});
video.addEventListener('playing', () => {
  clearTimeout(timer);
  state = 'ready';
  video.classList.add('is-ready');
  labels();
});
video.addEventListener('error', () => {
  if (video.error) failed(generation);
});
preference.addEventListener('change', event => { paused = event.matches; sync(); });
document.addEventListener('visibilitychange', sync);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(video);
} else {
  inView = true;
}
sync();
