import './site.js';
import './hero-video.js';
import './text-reveal.js';

// The hero uses a pre-rendered original loop; load interactive 3D near its section.
const technology = document.querySelector('#technology');
const studySteps = [...technology.querySelectorAll('.reveal-step')];
// The slim side rail stays fully navigable without visible numbers or labels.
technology.querySelector('.reveal-steps').addEventListener('keydown', event => {
  const current = studySteps.indexOf(event.target.closest('.reveal-step'));
  if (current < 0) return;
  let next;
  if (event.key === 'ArrowUp') next = Math.max(0, current - 1);
  else if (event.key === 'ArrowDown') next = Math.min(studySteps.length - 1, current + 1);
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = studySteps.length - 1;
  else return;
  event.preventDefault();
  studySteps[next].focus({ preventScroll: true });
  studySteps[next].click();
});
function showStudyFallback() {
  // A failed code request must not leave several screens of empty scroll space.
  // Keep the explanation usable even when the interactive renderer cannot load.
  technology.classList.add('reveal-static');
  technology.dataset.loadState = 'failed';
  const stage = document.querySelector('#reveal-stage');
  stage.querySelector('canvas')?.remove();
  stage.dataset.renderState = 'fallback';
  stage.setAttribute('aria-label', 'Static illustration of a hunting rifle. Use the view buttons to read about its exterior assemblies.');
  document.querySelector('#reveal-poster').hidden = false;
  const instruction = document.querySelector('#reveal-instruction');
  if (instruction) instruction.textContent = 'Still views · animation unavailable';
  const panels = [...document.querySelectorAll('.reveal-panel')];
  const steps = [...document.querySelectorAll('.reveal-step')];
  function selectView(index) {
    panels.forEach((panel, i) => { panel.hidden = i !== index || panel.hasAttribute('data-captionless'); });
    technology.dataset.captionless = String(panels[index].hasAttribute('data-captionless'));
    steps.forEach((step, i) => step.setAttribute('aria-current', i === index ? 'step' : 'false'));
    technology.dataset.step = String(index);
    technology.style.setProperty('--reveal-progress', String(index / (steps.length - 1)));
  }
  steps.forEach((step, index) => step.addEventListener('click', () => selectView(index)));
  selectView(0);
  const retry = document.querySelector('#reveal-motion');
  retry.disabled = false;
  retry.removeAttribute('aria-pressed');
  retry.setAttribute('aria-label', 'Reload the page to retry the animation');
  retry.textContent = 'Reload animation';
  // Browsers can cache a rejected module import for this document's lifetime.
  // A fresh document retries it reliably, including after a deployment update.
  retry.addEventListener('click', () => location.reload());
}
const loadStudy = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    loadStudy.disconnect();
    technology.dataset.loadState = 'loading';
    import('./scroll-reveal.js')
      .then(() => { technology.dataset.loadState = 'ready'; })
      .catch(showStudyFallback);
  }
}, { rootMargin: '900px' });
loadStudy.observe(technology);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.registration-goal, .registration-form').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('reveal-ready'); observer.observe(element); }
  });
}
