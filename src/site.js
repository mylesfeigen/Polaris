const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'info@polarishunting.com';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelector('#privacy-button')?.addEventListener('click', () => document.querySelector('#privacy-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
});
document.querySelectorAll('.contact-email').forEach(link => {
  link.href = `mailto:${contactEmail}`;
  link.replaceChildren(document.createTextNode(contactEmail));
});
document.querySelector('#interest-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const selected = String(data.get('interest') || '');
  const interests = selected === 'Both' ? ['Early access', 'Investing'] : [selected];
  const status = document.querySelector('#form-status');
  if (!interests.every(value => ['Early access', 'Field testing', 'Investment', 'Industry partnerships', 'Investing', 'General enquiry'].includes(value))) { status.textContent = 'Please choose your area of interest.'; return; }
  const name = String(data.get('name') || '').trim();
  const message = String(data.get('message') || '').trim();
  const body = `Hi Myles and Kenrick,\n\nI'm interested in Polaris: ${interests.join(' and ')}.\n\nPlease get in touch with me at ${data.get('email')}.\n${message ? `\n${message}\n` : ''}${interests.includes('Early access') ? '\nI would also like to receive development updates about Echo and Chrono.\n' : ''}\nThanks!${name ? `\n${name}` : ''}`;
  const href = `mailto:${contactEmail}?subject=${encodeURIComponent(`Polaris — ${interests.join(' & ')}`)}&body=${encodeURIComponent(body)}`;
  status.replaceChildren(document.createTextNode('Your email draft is ready. Send it from your email app to complete your enquiry. If your app didn’t open, email '));
  const fallback = document.createElement('a');
  fallback.href = href; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
  fallback.textContent = contactEmail; status.append(fallback, '.');
  fallback.click();
});
document.querySelector('#year').textContent = new Date().getFullYear();

