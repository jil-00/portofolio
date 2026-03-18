const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = navLinks ? navLinks.querySelectorAll('a[href^="#"]') : [];

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

if (navAnchors.length) {
  const linkedSections = Array.from(navAnchors)
    .map((anchor) => {
      const sectionId = anchor.getAttribute('href');
      if (!sectionId) {
        return null;
      }

      const section = document.querySelector(sectionId);
      return section ? { anchor, section } : null;
    })
    .filter(Boolean);

  const updateActiveNav = () => {
    const scrollPosition = window.scrollY + 120;
    let current = linkedSections[0];

    linkedSections.forEach((item) => {
      if (item.section.offsetTop <= scrollPosition) {
        current = item;
      }
    });

    linkedSections.forEach((item) => {
      item.anchor.classList.remove('active');
      item.anchor.removeAttribute('aria-current');
    });
    if (current) {
      current.anchor.classList.add('active');
      current.anchor.setAttribute('aria-current', 'page');
    }
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const backToTopButton = document.getElementById('backToTop');
const starsLayer = document.querySelector('.bg-stars');
const meteorsLayer = document.querySelector('.bg-meteors');

if (backToTopButton) {
  const toggleBackToTop = () => {
    const shouldShow = window.scrollY > 260;
    backToTopButton.classList.toggle('visible', shouldShow);
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const animatedElements = document.querySelectorAll('.animate-on-scroll');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (starsLayer) {
  const starCount = 140;

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement('span');
    star.className = 'star';

    const x = `${Math.random() * 100}%`;
    const y = `${Math.random() * 100}%`;
    const size = `${1 + Math.random() * 2.2}px`;
    const opacity = `${0.35 + Math.random() * 0.65}`;
    const duration = `${2.8 + Math.random() * 5.5}s`;
    const delay = `${Math.random() * 3.5}s`;

    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--size', size);
    star.style.setProperty('--opacity', opacity);
    star.style.setProperty('--duration', duration);
    star.style.setProperty('--delay', delay);

    starsLayer.appendChild(star);
  }
}

if (meteorsLayer && !prefersReducedMotion) {
  const spawnMeteor = () => {
    const meteor = document.createElement('span');
    meteor.className = 'meteor';

    const lane = Math.random();
    const startX = `${2 + lane * 96}%`;
    const startY = `${-30 + Math.random() * 10}%`;
    const length = `${110 + Math.random() * 120}px`;
    const duration = `${0.55 + Math.random() * 0.58}s`;
    const angle = `${-84 + (Math.random() * 16 - 8)}deg`;
    const travelX = `${-40 + Math.random() * 80}px`;
    const travelY = `${700 + Math.random() * 560}px`;

    meteor.style.setProperty('--x', startX);
    meteor.style.setProperty('--y', startY);
    meteor.style.setProperty('--len', length);
    meteor.style.setProperty('--dur', duration);
    meteor.style.setProperty('--angle', angle);
    meteor.style.setProperty('--travelX', travelX);
    meteor.style.setProperty('--travelY', travelY);

    meteorsLayer.appendChild(meteor);
    meteor.addEventListener('animationend', () => {
      const rect = meteor.getBoundingClientRect();
      const impact = document.createElement('span');
      impact.className = 'meteor-impact';
      impact.style.left = `${rect.right}px`;
      impact.style.top = `${rect.bottom}px`;
      document.body.appendChild(impact);
      impact.addEventListener('animationend', () => impact.remove());
      meteor.remove();
    });
  };

  const queueMeteor = () => {
    const burstCount = 2 + Math.floor(Math.random() * 4);
    for (let index = 0; index < burstCount; index += 1) {
      window.setTimeout(spawnMeteor, index * (30 + Math.random() * 70));
    }

    const nextDelay = 160 + Math.random() * 480;
    window.setTimeout(queueMeteor, nextDelay);
  };

  queueMeteor();
}

const createClickBurst = (x, y) => {
  const particles = 16;

  for (let index = 0; index < particles; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'boom-particle';
    particle.style.left = `${x - 4}px`;
    particle.style.top = `${y - 4}px`;

    const angle = (Math.PI * 2 * index) / particles + Math.random() * 0.25;
    const distance = 36 + Math.random() * 48;
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    particle.style.setProperty('--dx', `${offsetX}px`);
    particle.style.setProperty('--dy', `${offsetY}px`);

    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }
};

if (!prefersReducedMotion) {
  document.addEventListener('click', (event) => {
    createClickBurst(event.clientX, event.clientY);
  });
}

animatedElements.forEach((element, index) => {
  const delay = Math.min(index * 0.04, 0.32);
  element.style.setProperty('--reveal-delay', `${delay}s`);
});

if (prefersReducedMotion) {
  animatedElements.forEach((element) => element.classList.add('in-view'));
} else if (animatedElements.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  animatedElements.forEach((element) => observer.observe(element));
}
