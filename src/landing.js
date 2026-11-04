import './site.js';
import './text-reveal.js';
const interest = document.querySelector('#interest');
const pageURL = new URL(window.__POLARIS_PREVIEW_URL || location.href);
const requestedInterest = pageURL.searchParams.get('interest');
if ([...interest.options].some(option => option.value === requestedInterest)) interest.value = requestedInterest;
document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => {
  interest.value = link.dataset.interest;
}));
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.enter').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('ready'); observer.observe(element); }
  });
}
