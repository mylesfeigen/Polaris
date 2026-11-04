import './site.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (!motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) {
      element.classList.add('ready');
      observer.observe(element);
    }
  });
}
