// The arriving mission lifts over the hero. Native sticky positioning keeps
// the photograph still, without intercepting wheel/touch input or pinning text.
const sequence = document.querySelector('.hero-mission-sequence');
const hero = sequence?.querySelector('.landscape-hero');
if (sequence && hero) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function updateReveal() {
    // Tall content must stay in normal flow at small heights / larger zoom.
    const fits = hero.offsetHeight <= document.documentElement.clientHeight + 1;
    sequence.classList.toggle('mission-reveal', !preference.matches && fits);
  }
  new ResizeObserver(updateReveal).observe(hero);
  hero.addEventListener('focusin', event => {
    const missionTop = sequence.querySelector('#mission').getBoundingClientRect().top;
    if (event.target.getBoundingClientRect().bottom > missionTop) {
      scrollTo({ top: scrollY + sequence.getBoundingClientRect().top, behavior: 'instant' });
    }
  });
  addEventListener('resize', updateReveal, { passive: true });
  preference.addEventListener('change', updateReveal);
  document.fonts?.ready.then(updateReveal);
  updateReveal();
}
