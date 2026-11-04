import './site.js';
import './text-reveal.js';
const interest = document.querySelector('#interest');
const pageURL = new URL(window.__POLARIS_PREVIEW_URL || location.href);
const requestedInterest = pageURL.searchParams.get('interest');
if ([...interest.options].some(option => option.value === requestedInterest)) interest.value = requestedInterest;
document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => {
  interest.value = link.dataset.interest;
}));
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.enter').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('ready'); observer.observe(element); }
  });
}

// Native scrolling drives a small, damped movement in the hero photograph.
// No wheel/touch interception: scrolling, anchors and keyboard navigation stay native.
const hero = document.querySelector('.landscape-hero');
let frame = null;
let lastTime = 0;
let offset = 0;
let heroVisible = true;
function paintHero(time) {
  frame = null;
  if (motionPreference.matches || document.hidden || !heroVisible) { lastTime = 0; return; }
  const bounds = hero.getBoundingClientRect();
  const target = Math.min(bounds.height * .05, Math.max(0, -bounds.top) * .08);
  const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
  offset += (target - offset) * (1 - Math.exp(-elapsed / 140));
  if (Math.abs(target - offset) < .05) offset = target;
  hero.style.setProperty('--hero-offset', `${offset.toFixed(2)}px`);
  lastTime = time;
  if (offset !== target) frame = requestAnimationFrame(paintHero);
  else lastTime = 0;
}
function scheduleHero() {
  if (frame === null && heroVisible && !motionPreference.matches && !document.hidden) frame = requestAnimationFrame(paintHero);
}
addEventListener('scroll', scheduleHero, { passive: true });
addEventListener('resize', scheduleHero, { passive: true });
document.addEventListener('visibilitychange', scheduleHero);
motionPreference.addEventListener('change', () => {
  offset = 0;
  hero.style.removeProperty('--hero-offset');
  scheduleHero();
});
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  if (heroVisible) scheduleHero();
  else if (frame !== null) { cancelAnimationFrame(frame); frame = null; lastTime = 0; }
}).observe(hero);
scheduleHero();
