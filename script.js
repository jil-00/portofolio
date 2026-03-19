const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = navLinks ? navLinks.querySelectorAll('a[href^="#"]') : [];
const interactiveMagnetic = document.querySelectorAll(
  '.btn, .project-links a, .hero-socials a, .contact-link-card, .back-to-top'
);
const tiltCards = document.querySelectorAll('.project-card, .hero-card');
const pointerState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  active: false,
};
const starsForRepel = [];

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
const fxQualitySelect = document.getElementById('fxQuality');
const fxModeHint = document.getElementById('fxModeHint');

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
const swapNameEl = document.getElementById('swapName');
const isSmallViewport = window.matchMedia('(max-width: 900px)').matches;
const hasLowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
const hasLowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
const autoLiteFx = !prefersReducedMotion && (isSmallViewport || hasLowCpu || hasLowMemory);
const savedQuality = window.localStorage.getItem('fx-quality');
const validQuality = savedQuality === 'high' || savedQuality === 'balanced' || savedQuality === 'lite';
const qualityMode = validQuality ? savedQuality : autoLiteFx ? 'lite' : 'balanced';
const useLiteFx = prefersReducedMotion || qualityMode === 'lite';
const useHighFx = !prefersReducedMotion && qualityMode === 'high';
const useBalancedFx = !prefersReducedMotion && qualityMode === 'balanced';

if (useLiteFx) {
  document.body.classList.add('fx-lite');
}

if (useBalancedFx) {
  document.body.classList.add('fx-balanced');
}

if (fxQualitySelect) {
  fxQualitySelect.value = qualityMode;
  fxQualitySelect.addEventListener('change', () => {
    window.localStorage.setItem('fx-quality', fxQualitySelect.value);
    window.location.reload();
  });
}

if (fxModeHint) {
  const modeHintMap = {
    high: 'High visuals enabled',
    balanced: 'Balanced mode',
    lite: 'Lite mode for speed',
  };

  fxModeHint.textContent = modeHintMap[qualityMode] || 'Balanced mode';
}

if (swapNameEl) {
  if (prefersReducedMotion) {
    swapNameEl.textContent = 'R. Jithin Kumar';
  } else {
    const nameVariants = ['R. Jithin Kumar', 'CSE', 'Cyber Security'];
    let nameIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const tickNameSwap = () => {
      const currentName = nameVariants[nameIndex];

      if (!isDeleting) {
        charIndex += 1;
        swapNameEl.textContent = currentName.slice(0, charIndex);

        if (charIndex >= currentName.length) {
          isDeleting = true;
          window.setTimeout(tickNameSwap, 1100);
          return;
        }

        window.setTimeout(tickNameSwap, 95);
        return;
      }

      charIndex -= 1;
      swapNameEl.textContent = currentName.slice(0, charIndex);

      if (charIndex <= 0) {
        isDeleting = false;
        nameIndex = (nameIndex + 1) % nameVariants.length;
        window.setTimeout(tickNameSwap, 240);
        return;
      }

      window.setTimeout(tickNameSwap, 52);
    };

    tickNameSwap();
  }
}

if (useHighFx && interactiveMagnetic.length) {
  interactiveMagnetic.forEach((element) => {
    element.classList.add('magnetic');

    const springBack = () => {
      element.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
      element.style.transform = '';
    };

    element.addEventListener('mousemove', (event) => {
      const bounds = element.getBoundingClientRect();
      const offsetX = event.clientX - bounds.left - bounds.width / 2;
      const offsetY = event.clientY - bounds.top - bounds.height / 2;

      element.style.transition = 'transform 110ms ease-out';
      element.style.transform = `translate(${offsetX * 0.12}px, ${offsetY * 0.12}px)`;
    });

    element.addEventListener('mouseleave', springBack);
    element.addEventListener('blur', springBack);
  });
}

if (useHighFx && tiltCards.length) {
  tiltCards.forEach((card) => {
    const resetTilt = () => {
      card.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';
      card.style.transform = '';
    };

    card.addEventListener('mousemove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      const tiltX = (0.5 - y) * 8;
      const tiltY = (x - 0.5) * 10;

      card.style.transition = 'transform 90ms ease-out';
      card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', resetTilt);
    card.addEventListener('blur', resetTilt);
  });
}

if (useHighFx) {
  const core = document.createElement('span');
  const glow = document.createElement('span');
  core.className = 'cursor-core';
  glow.className = 'cursor-glow';
  document.body.append(core, glow);

  const trail = { x: pointerState.x, y: pointerState.y };

  const renderCursor = () => {
    trail.x += (pointerState.x - trail.x) * 0.16;
    trail.y += (pointerState.y - trail.y) * 0.16;

    core.style.transform = `translate3d(${pointerState.x}px, ${pointerState.y}px, 0) translate(-50%, -50%)`;
    glow.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%)`;

    window.requestAnimationFrame(renderCursor);
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.active = true;
      document.body.classList.add('pointer-ready');
    },
    { passive: true }
  );

  document.addEventListener('pointerdown', () => {
    core.style.transform += ' scale(0.9)';
  });

  document.addEventListener('pointerup', () => {
    core.style.transform = `translate3d(${pointerState.x}px, ${pointerState.y}px, 0) translate(-50%, -50%)`;
  });

  window.requestAnimationFrame(renderCursor);
}

if (starsLayer) {
  const starCount = useLiteFx ? 72 : useBalancedFx ? 120 : 170;

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement('span');
    star.className = 'star';

    const xValue = Math.random() * 100;
    const yValue = Math.random() * 100;
    const x = `${xValue}%`;
    const y = `${yValue}%`;
    const size = `${1 + Math.random() * 2.2}px`;
    const opacity = `${0.35 + Math.random() * 0.65}`;
    const duration = `${3.2 + Math.random() * 6.2}s`;
    const delay = `${Math.random() * 4}s`;

    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--size', size);
    star.style.setProperty('--opacity', opacity);
    star.style.setProperty('--duration', duration);
    star.style.setProperty('--delay', delay);

    starsLayer.appendChild(star);
    starsForRepel.push({
      node: star,
      xRatio: xValue / 100,
      yRatio: yValue / 100,
      strength: 0.7 + Math.random() * 0.7,
    });
  }

  const superstarCount = useLiteFx ? 4 : useBalancedFx ? 8 : 12;
  for (let index = 0; index < superstarCount; index += 1) {
    const star = document.createElement('span');
    star.className = 'star';

    const xValue = Math.random() * 100;
    const yValue = Math.random() * 100;
    const x = `${xValue}%`;
    const y = `${yValue}%`;
    const size = `${3 + Math.random() * 2.6}px`;
    const opacity = `${0.68 + Math.random() * 0.3}`;
    const duration = `${3.2 + Math.random() * 4.1}s`;
    const delay = `${Math.random() * 2.4}s`;

    star.style.setProperty('--x', x);
    star.style.setProperty('--y', y);
    star.style.setProperty('--size', size);
    star.style.setProperty('--opacity', opacity);
    star.style.setProperty('--duration', duration);
    star.style.setProperty('--delay', delay);

    starsLayer.appendChild(star);
    starsForRepel.push({
      node: star,
      xRatio: xValue / 100,
      yRatio: yValue / 100,
      strength: 1 + Math.random() * 0.9,
    });
  }
}

if (useHighFx && starsForRepel.length) {
  const repelRadius = 170;
  const maxShift = 28;

  const animateStarRepel = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    starsForRepel.forEach((starItem) => {
      if (!pointerState.active) {
        starItem.node.style.setProperty('--tx', '0px');
        starItem.node.style.setProperty('--ty', '0px');
        return;
      }

      const starX = starItem.xRatio * width;
      const starY = starItem.yRatio * height;
      const dx = starX - pointerState.x;
      const dy = starY - pointerState.y;
      const distance = Math.hypot(dx, dy);

      if (distance > repelRadius || distance === 0) {
        starItem.node.style.setProperty('--tx', '0px');
        starItem.node.style.setProperty('--ty', '0px');
        return;
      }

      const falloff = 1 - distance / repelRadius;
      const move = falloff * maxShift * starItem.strength;
      const tx = (dx / distance) * move;
      const ty = (dy / distance) * move;

      starItem.node.style.setProperty('--tx', `${tx.toFixed(2)}px`);
      starItem.node.style.setProperty('--ty', `${ty.toFixed(2)}px`);
    });

    window.requestAnimationFrame(animateStarRepel);
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.active = true;
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', () => {
    pointerState.active = false;
  });

  window.addEventListener('blur', () => {
    pointerState.active = false;
  });

  window.requestAnimationFrame(animateStarRepel);
}

if (meteorsLayer) {
  const maxActiveMeteors = useLiteFx ? 6 : useBalancedFx ? 10 : 18;

  const spawnMeteor = () => {
    if (meteorsLayer.childElementCount >= maxActiveMeteors) {
      return;
    }

    const meteor = document.createElement('span');
    meteor.className = 'meteor';

    const lane = Math.random();
    const startX = `${2 + lane * 96}%`;
    const startY = `${-30 + Math.random() * 10}%`;
    const length = `${100 + Math.random() * 120}px`;
    const duration = `${0.72 + Math.random() * 0.56}s`;
    const angle = `${-90 + (Math.random() * 7 - 3.5)}deg`;
    const travelX = `${-28 + Math.random() * 56}px`;
    const travelY = `${860 + Math.random() * 560}px`;

    meteor.style.setProperty('--x', startX);
    meteor.style.setProperty('--y', startY);
    meteor.style.setProperty('--len', length);
    meteor.style.setProperty('--dur', duration);
    meteor.style.setProperty('--angle', angle);
    meteor.style.setProperty('--travelX', travelX);
    meteor.style.setProperty('--travelY', travelY);

    meteorsLayer.appendChild(meteor);
    meteor.addEventListener('animationend', () => {
      if (Math.random() < 0.35) {
        const rect = meteor.getBoundingClientRect();
        const impact = document.createElement('span');
        impact.className = 'meteor-impact';
        impact.style.left = `${rect.right}px`;
        impact.style.top = `${rect.bottom}px`;
        document.body.appendChild(impact);
        impact.addEventListener('animationend', () => impact.remove());
      }
      meteor.remove();
    });
  };

  const queueMeteor = () => {
    const burstCount = useLiteFx ? 1 : useBalancedFx ? 2 : 2 + Math.floor(Math.random() * 3);
    for (let index = 0; index < burstCount; index += 1) {
      const burstGap = useLiteFx ? 120 : useBalancedFx ? 100 + Math.random() * 120 : 52 + Math.random() * 88;
      window.setTimeout(spawnMeteor, index * burstGap);
    }

    const nextDelay = useLiteFx
      ? 1300 + Math.random() * 1900
      : useBalancedFx
      ? 760 + Math.random() * 1040
      : 240 + Math.random() * 560;
    window.setTimeout(queueMeteor, nextDelay);
  };

  // Seed a few meteors immediately so the shower is visible as soon as page loads.
  const seedCount = useLiteFx ? 1 : 3;
  for (let index = 0; index < seedCount; index += 1) {
    window.setTimeout(spawnMeteor, index * 120);
  }

  queueMeteor();
}

const createClickBurst = (x, y) => {
  const particles = useLiteFx ? 10 : useBalancedFx ? 16 : 22;

  for (let index = 0; index < particles; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'boom-particle';
    particle.style.left = `${x - 4}px`;
    particle.style.top = `${y - 8}px`;

    const angle = (Math.PI * 2 * index) / particles + Math.random() * 0.35;
    const distance = 28 + Math.random() * 52;
    const offsetX = Math.cos(angle) * distance * 0.9;
    const offsetY = -20 - Math.abs(Math.sin(angle) * distance * 1.35);
    const size = 4 + Math.random() * 8;
    const hue = 20 + Math.random() * 24;

    particle.style.setProperty('--dx', `${offsetX}px`);
    particle.style.setProperty('--dy', `${offsetY}px`);
    particle.style.setProperty('--size', `${size}px`);
    particle.style.setProperty('--hue', `${hue}`);

    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }
};

if (!prefersReducedMotion && !useLiteFx) {
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
