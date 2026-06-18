// PROGRESS + SCROLLED NAV
const prog = document.getElementById('prog'),
      nav = document.getElementById('topnav');

window.addEventListener('scroll', () => {
  prog.style.width =
    (window.scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// REVEAL
const rvObs = new IntersectionObserver(
  es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  }),
  { threshold: .08 }
);

document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

// NAV DOTS
const secIds = [
  'hero','about','skills','featured',
  'projects','achievements','education','contact'
];

const dots = document.querySelectorAll('.sd');

const sdObs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      dots.forEach(d =>
        d.classList.toggle('active', d.dataset.t === id)
      );
    }
  });
}, { threshold: .3 });

secIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) sdObs.observe(el);
});

dots.forEach(d =>
  d.addEventListener('click', () =>
    document.getElementById(d.dataset.t)
      ?.scrollIntoView({ behavior: 'smooth' })
  )
);

// COUNTERS
function animInt(el) {
  const to = +el.dataset.to, steps = 60;
  let i = 0;

  const t = setInterval(() => {
    i++;
    el.textContent = Math.round(to * (i / steps));

    if (i >= steps) {
      el.textContent = to;
      clearInterval(t);
    }
  }, 22);
}

function animFloat(el) {
  const to = +el.dataset.to, steps = 60;
  let i = 0;

  const t = setInterval(() => {
    i++;
    el.textContent = (to * (i / steps)).toFixed(2);

    if (i >= steps) {
      el.textContent = to;
      clearInterval(t);
    }
  }, 22);
}

const cObs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting && !e.target._done) {
      e.target._done = 1;

      e.target.classList.contains('countf')
        ? animFloat(e.target)
        : animInt(e.target);
    }
  });
}, { threshold: .5 });

document.querySelectorAll('.counter,.countf')
  .forEach(el => cObs.observe(el));

// 3D TILT
document.querySelectorAll('.tilt-card').forEach(c => {

  c.addEventListener('mousemove', e => {

    const r = c.getBoundingClientRect();

    const rx =
      -(e.clientY - r.top - r.height / 2) /
      (r.height / 2) * 8;

    const ry =
      (e.clientX - r.left - r.width / 2) /
      (r.width / 2) * 8;

    c.style.transition = 'transform .08s ease';

    c.style.transform =
      `perspective(900px)
       rotateX(${rx}deg)
       rotateY(${ry}deg)
       scale(1.025)`;
  });

  c.addEventListener('mouseleave', () => {
    c.style.transition =
      'transform .55s cubic-bezier(.22,1,.36,1)';

    c.style.transform =
      'perspective(900px) rotateX(0) rotateY(0) scale(1)';
  });

});
