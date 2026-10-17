// Menu mobile
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open'); burger.setAttribute('aria-expanded', false);
}));

// Apparition au scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Lightbox galerie
const lb = document.getElementById('lb');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('p');
document.querySelectorAll('.g').forEach(b => b.addEventListener('click', () => {
  lbImg.src = b.dataset.src; lbImg.alt = b.dataset.cap; lbCap.textContent = b.dataset.cap;
  lb.hidden = false;
}));
const closeLb = () => { lb.hidden = true; };
lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

// Formulaire : ouvre l'application mail avec le message pré-rempli
const form = document.getElementById('form');
const note = document.getElementById('note');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => {
    const bad = !f.value.trim();
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) { note.textContent = 'Merci de remplir tous les champs.'; return; }
  const d = new FormData(form);
  const subject = encodeURIComponent('Contact site Tony Blackwolf — ' + d.get('nom'));
  const body = encodeURIComponent(
    'Nom / pseudo : ' + d.get('nom') + '\n' +
    'Contact : ' + d.get('contact') + '\n\n' + d.get('message'));
  note.textContent = 'Ouverture de votre messagerie…';
  window.location.href = 'mailto:TonyBlackwolf188@gmail.com?subject=' + subject + '&body=' + body;
});

document.getElementById('year').textContent = new Date().getFullYear();
