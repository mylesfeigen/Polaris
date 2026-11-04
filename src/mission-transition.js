// Native sticky positioning creates the panel reveal without wheel handlers,
// artificial scroll distance or a pinned reading section.
const sequence = document.querySelector('.mission-sequence');
const solution = sequence?.querySelector('#solution');
if (sequence && solution) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function updateReveal() {
    // A panel taller than the viewport must scroll normally so its first lines
    // stay reachable on small screens, at larger text sizes and when zoomed in.
    const fits = solution.offsetHeight <= document.documentElement.clientHeight;
    sequence.classList.toggle('mission-reveal', !preference.matches && fits);
  }
  new ResizeObserver(updateReveal).observe(solution);
  solution.addEventListener('focusin', event => {
    const mission = sequence.querySelector('#mission');
    // A sticky control can already be inside the viewport yet still covered
    // by the outgoing panel. Reveal it when reached with the keyboard.
    if (event.target.getBoundingClientRect().top < mission.getBoundingClientRect().bottom) {
      scrollTo({ top: scrollY + mission.getBoundingClientRect().bottom, behavior: 'instant' });
    }
  });
  addEventListener('resize', updateReveal, { passive: true });
  preference.addEventListener('change', updateReveal);
  document.fonts?.ready.then(updateReveal);
  updateReveal();
}
