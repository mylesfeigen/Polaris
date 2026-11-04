const directions = ['field', 'studio', 'horizon'];
const choices = [...document.querySelectorAll('.direction-selector button')];
const sourceButtons = [...document.querySelectorAll('.sources button')];
const sources = [
  { name: 'TREE LINE', angle: 315, cardinal: 'NW' },
  { name: 'RIDGE', angle: 45, cardinal: 'NE' },
  { name: 'VALLEY', angle: 120, cardinal: 'SE' },
];
function selectDirection(direction, writeHistory = false) {
  const next = directions.includes(direction) ? direction : 'field';
  document.body.dataset.direction = next;
  choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.direction === next)));
  document.querySelector('meta[name="theme-color"]').content = next === 'studio' ? '#f3f1eb' : '#151515';
  if (writeHistory) {
    const url = new URL(location.href);
    url.searchParams.set('direction', next);
    history.pushState({}, '', url);
  }
}
choices.forEach(button => button.addEventListener('click', () => selectDirection(button.dataset.direction, true)));
window.addEventListener('popstate', () => selectDirection(new URL(location.href).searchParams.get('direction')));
selectDirection(new URL(location.href).searchParams.get('direction'));
function selectSource(index) {
  const source = sources[index];
  document.querySelector('#radar-vector').style.transform = `rotate(${source.angle}deg)`;
  document.querySelector('#source-name').textContent = source.name;
  const bearing = document.querySelector('#bearing');
  const cardinal = document.createElement('em'); cardinal.textContent = source.cardinal;
  bearing.replaceChildren(document.createTextNode(`${source.angle}° `), cardinal);
  sourceButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.source) === index)));
}
sourceButtons.forEach(button => button.addEventListener('click', () => selectSource(Number(button.dataset.source))));
selectSource(0);
const motionToggle = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function setMotion(paused) {
  document.body.classList.toggle('paused', paused);
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.replaceChildren(document.createTextNode(paused ? 'Play motion ' : 'Pause motion '));
  const icon = document.createElement('span'); icon.textContent = paused ? '▶' : 'Ⅱ'; motionToggle.append(icon);
}
setMotion(reducedMotion.matches);
motionToggle.addEventListener('click', () => setMotion(!document.body.classList.contains('paused')));
reducedMotion.addEventListener('change', event => setMotion(event.matches));
