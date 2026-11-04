import './site.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const elements = [...document.querySelectorAll('.reveal')];
let observer;

function reveal(element) {
  element.classList.add('visible');
  observer?.unobserve(element);
}

function initialiseMotion() {
  observer?.disconnect();
  if (motion.matches || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.remove('ready', 'visible'));
    return;
  }
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -16px 0px' });
  elements.forEach(element => {
    element.classList.add('ready');
    if (!element.classList.contains('visible')) observer.observe(element);
  });
}

// Keep keyboard focus visible even before a scroll-triggered entrance runs.
document.addEventListener('focusin', event => {
  const element = event.target.closest('.reveal');
  if (element) reveal(element);
});
motion.addEventListener('change', initialiseMotion);
initialiseMotion();
