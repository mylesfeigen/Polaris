const story = document.querySelector('.development-story');
if (story) {
  const chapters = [...story.querySelectorAll('[data-development-stage]')];
  const stops = [...story.querySelectorAll('[data-trail-stage]')];
  const stageLabel = story.querySelector('.field-note-stage');
  const labels = ['Research / Listen', 'Field testing / Learn', 'Prototype trials / Refine', 'Early access / Share'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let current = -1;

  function draw() {
    frame = null;
    if (preference.matches) {
      story.classList.remove('story-enhanced');
      story.style.setProperty('--journey-progress', '1');
      stageLabel.textContent = 'Listen. Learn. Refine.';
      return;
    }
    story.classList.add('story-enhanced');
    const line = innerHeight * .54;
    const positions = chapters.map(chapter => {
      const bounds = chapter.getBoundingClientRect();
      return bounds.top + Math.min(bounds.height * .4, 100);
    });
    const progress = Math.max(0, Math.min(1, (line - positions[0]) / Math.max(1, positions.at(-1) - positions[0])));
    story.style.setProperty('--journey-progress', progress.toFixed(4));
    const closest = positions.reduce((best, position, index) => Math.abs(position - line) < Math.abs(positions[best] - line) ? index : best, 0);
    if (closest === current) return;
    current = closest;
    story.dataset.storyStage = String(current);
    stageLabel.textContent = labels[current];
    chapters.forEach((chapter, index) => chapter.classList.toggle('is-current', index === current));
    stops.forEach((stop, index) => {
      stop.classList.toggle('is-current', index === current);
      stop.classList.toggle('is-passed', index < current);
    });
  }
  function schedule() {
    if (frame === null && !document.hidden) frame = requestAnimationFrame(draw);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  preference.addEventListener('change', () => { current = -1; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
