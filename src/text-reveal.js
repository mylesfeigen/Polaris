// Native scroll sets the target; a short, time-based ease softens wheel/touch steps.
function initialiseStatement() {
  const section = document.querySelector('.acoustic-statement');
  const stage = section?.querySelector('.statement-stage');
  const copy = section?.querySelector('.statement-copy');
  if (!section || !stage || !copy) return;

  const words = [];
  for (const paragraph of copy.querySelectorAll('.statement-paragraph')) {
    const fragment = document.createDocumentFragment();
    // Text nodes between inline spans preserve normal sentence reading and selection.
    for (const token of paragraph.textContent.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) fragment.append(document.createTextNode(token));
      else {
        const word = document.createElement('span');
        word.className = 'statement-word';
        word.textContent = token;
        word.style.setProperty('--word-progress', '1');
        words.push({ element: word, progress: 1 });
        fragment.append(word);
      }
    }
    paragraph.replaceChildren(fragment);
  }
  if (!words.length) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  const responseTime = 140;
  const revealBand = 3;
  let animated = false;
  let inView = true;
  let needsLayout = true;
  let needsSnap = true;
  let request = null;
  let previousTime = 0;
  let renderedProgress = 1;

  function setProgress(value) {
    // A few neighbouring words overlap in their fades, avoiding a hard cursor
    // moving from word to word. Both ends still resolve to exact grey/white.
    const readingPosition = value * (words.length + revealBand - 1);
    words.forEach((word, index) => {
      const progress = smooth(clamp((readingPosition - index) / revealBand));
      if (progress === word.progress) return;
      word.progress = progress;
      word.element.style.setProperty('--word-progress', progress.toFixed(4));
    });
    section.dataset.revealProgress = value.toFixed(4);
  }

  function measureLayout() {
    needsLayout = false;
    needsSnap = true;
    animated = !preference.matches;
    section.classList.toggle('statement-enhanced', animated);
    section.classList.toggle('statement-static', !animated);
  }

  function draw(time) {
    request = null;
    if (needsLayout) measureLayout();
    if (document.hidden) return;
    // Reveal as the copy itself crosses the viewport. Its container stays in
    // normal document flow: no pinned stage or extra scroll distance is needed.
    const bounds = copy.getBoundingClientRect();
    // Finish while the last line is comfortably visible, before the following
    // section. Taller mobile copy reveals progressively at reading height.
    const start = innerHeight * .95;
    const end = innerHeight * .88;
    const target = animated ? clamp((start - bounds.top) / (bounds.height + start - end)) : 1;
    section.dataset.revealTarget = target.toFixed(4);
    if (needsSnap || !animated || !inView || target === 1) {
      renderedProgress = target;
      needsSnap = false;
    } else {
      const elapsed = previousTime ? Math.min(64, time - previousTime) : 1000 / 60;
      renderedProgress += (target - renderedProgress) * (1 - Math.exp(-elapsed / responseTime));
      if (Math.abs(target - renderedProgress) < .0001) renderedProgress = target;
    }
    setProgress(renderedProgress);
    const settling = animated && inView && renderedProgress !== target;
    section.dataset.revealMotion = settling ? 'settling' : 'idle';
    previousTime = settling ? time : 0;
    if (settling) request = requestAnimationFrame(draw);
  }

  function stop() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    previousTime = 0;
    needsSnap = true;
    section.dataset.revealMotion = 'idle';
  }

  function schedule(layout = false) {
    needsLayout ||= layout;
    if (document.hidden || (!inView && !needsLayout) || request !== null) return;
    request = requestAnimationFrame(draw);
  }

  addEventListener('scroll', () => {
    if (animated && inView) schedule();
  }, { passive: true });
  addEventListener('resize', () => schedule(true), { passive: true });
  preference.addEventListener('change', () => schedule(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else { needsSnap = true; schedule(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) { needsSnap = true; schedule(); }
      else stop();
    }, { rootMargin: '100px 0px' }).observe(section);
  }
  document.fonts?.ready.then(() => schedule(true));
  schedule(true);
}

initialiseStatement();
