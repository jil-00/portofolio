const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const navAnchors = navLinks ? navLinks.querySelectorAll('a[href^="#"]') : [];
const interactiveMagnetic = document.querySelectorAll(
  '.btn, .project-links a, .hero-socials a, .contact-link-card, .back-to-top'
);
const VISITOR_LOG_KEY = 'portfolio-visitor-logs-v1';
const BLOCKED_VISITOR_KEY = 'portfolio-blocked-visitors-v1';
const ADMIN_VISITOR_ID_KEY = 'portfolio-admin-visitor-id-v1';
const ADMIN_SECRET_SEQUENCE = 'adminlog';
const ADMIN_HASH_SALT = 'p0rtf0lio.v1::';
const ADMIN_PASSCODE_HASH = '9652e5deda5ee3b41c4ae19b10b2a04e70d86246cb464eb76980ba3467ffe79d';
const ADMIN_AUTH_STATE_KEY = 'portfolio-admin-auth-state-v1';
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_LOCKOUT_MS = 2 * 60 * 1000;
const ADMIN_BYPASS_HASH = '#admin-bypass';
const tiltCards = document.querySelectorAll('.project-card, .hero-card');
const pointerState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  active: false,
};
const starsForRepel = [];

const hashVisitorKey = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return `v-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const getCurrentVisitorId = () => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const platform = navigator.userAgentData?.platform || navigator.platform || 'unknown';
  const rawKey = [navigator.userAgent || 'unknown', navigator.language || 'unknown', platform, timeZone]
    .join('|')
    .toLowerCase();
  return hashVisitorKey(rawKey);
};

const readBlockedVisitorIds = () => {
  try {
    const raw = window.localStorage.getItem(BLOCKED_VISITOR_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item) : [];
  } catch (error) {
    return [];
  }
};

const writeBlockedVisitorIds = (blockedIds) => {
  window.localStorage.setItem(BLOCKED_VISITOR_KEY, JSON.stringify(blockedIds));
};

const readAdminVisitorId = () => {
  const saved = window.localStorage.getItem(ADMIN_VISITOR_ID_KEY);
  return saved || '';
};

const writeAdminVisitorId = (visitorId) => {
  window.localStorage.setItem(ADMIN_VISITOR_ID_KEY, visitorId);
};

const renderBlockedAccessScreen = () => {
  document.body.className = '';
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#050913;color:#e9f2ff;font-family:Inter,system-ui,sans-serif;padding:2rem;text-align:center;">
      <div>
        <h1 style="margin:0 0 .6rem;font-size:1.8rem;">Access Restricted</h1>
        <p style="margin:0;color:#b8c8e4;">This visitor has been blocked by the site admin.</p>
      </div>
    </main>
  `;
};

const currentVisitorId = getCurrentVisitorId();
const blockedVisitors = readBlockedVisitorIds();
const allowBypass = window.location.hash === ADMIN_BYPASS_HASH;
if (blockedVisitors.includes(currentVisitorId) && !allowBypass) {
  renderBlockedAccessScreen();
  throw new Error('Blocked visitor.');
}

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

const readVisitorLogs = () => {
  try {
    const rawLogs = window.localStorage.getItem(VISITOR_LOG_KEY);
    if (!rawLogs) {
      return [];
    }

    const parsed = JSON.parse(rawLogs);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeVisitorLogs = (logs) => {
  window.localStorage.setItem(VISITOR_LOG_KEY, JSON.stringify(logs));
};

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

const hashStringSha256 = async (text) => {
  if (!window.crypto || !window.crypto.subtle) {
    return '';
  }

  const textBytes = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', textBytes);
  return bytesToHex(new Uint8Array(digest));
};

const readAdminAuthState = () => {
  try {
    const raw = window.sessionStorage.getItem(ADMIN_AUTH_STATE_KEY);
    if (!raw) {
      return { failedAttempts: 0, lockUntil: 0 };
    }

    const parsed = JSON.parse(raw);
    const failedAttempts = Number(parsed.failedAttempts) || 0;
    const lockUntil = Number(parsed.lockUntil) || 0;
    return { failedAttempts, lockUntil };
  } catch (error) {
    return { failedAttempts: 0, lockUntil: 0 };
  }
};

const writeAdminAuthState = (state) => {
  window.sessionStorage.setItem(ADMIN_AUTH_STATE_KEY, JSON.stringify(state));
};

const getLockRemainingMs = () => {
  const { lockUntil } = readAdminAuthState();
  return Math.max(0, lockUntil - Date.now());
};

const recordFailedAttempt = () => {
  const authState = readAdminAuthState();
  const failedAttempts = authState.failedAttempts + 1;

  if (failedAttempts >= ADMIN_MAX_ATTEMPTS) {
    writeAdminAuthState({ failedAttempts: 0, lockUntil: Date.now() + ADMIN_LOCKOUT_MS });
    return;
  }

  writeAdminAuthState({ failedAttempts, lockUntil: 0 });
};

const clearFailedAttempts = () => {
  writeAdminAuthState({ failedAttempts: 0, lockUntil: 0 });
};

const verifyAdminPasscode = async (enteredPasscode) => {
  const hashed = await hashStringSha256(`${ADMIN_HASH_SALT}${enteredPasscode}`);
  return hashed === ADMIN_PASSCODE_HASH;
};

const renderVisitorLogs = (tableBody) => {
  if (!tableBody) {
    return;
  }

  const logs = readVisitorLogs();
  const adminVisitorId = readAdminVisitorId() || currentVisitorId;
  const blockedSet = new Set(readBlockedVisitorIds());
  tableBody.innerHTML = '';

  if (!logs.length) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 8;
    emptyCell.textContent = 'No visitor logs found yet.';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }

  logs
    .slice()
    .reverse()
    .forEach((log) => {
      const row = document.createElement('tr');
      const cells = [
        log.timestamp || '-',
        log.path || '-',
        log.language || '-',
        log.platform || '-',
        log.timeZone || '-',
        log.referrer || 'Direct',
      ];

      cells.forEach((cellValue) => {
        const cell = document.createElement('td');
        cell.textContent = String(cellValue);
        row.appendChild(cell);
      });

      const actionCell = document.createElement('td');
      const visitorId = log.visitorId || '-';
      const isBlocked = visitorId !== '-' && blockedSet.has(visitorId);
      const isCurrentVisitor = visitorId !== '-' && visitorId === adminVisitorId;

      const roleCell = document.createElement('td');
      roleCell.textContent = isCurrentVisitor ? 'Admin' : 'Visitor';
      row.appendChild(roleCell);

      const actionButton = document.createElement('button');
      actionButton.type = 'button';
      actionButton.className = 'btn btn-soft';
      actionButton.dataset.adminToggleBlock = visitorId;
      actionButton.textContent = isCurrentVisitor ? 'You' : isBlocked ? 'Unblock' : 'Block';
      actionButton.disabled = visitorId === '-' || isCurrentVisitor;
      actionCell.appendChild(actionButton);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
};

const ensureAdminModal = () => {
  let modal = document.getElementById('adminLogModal');
  if (modal) {
    return {
      modal,
      status: modal.querySelector('[data-admin-status]'),
      tableBody: modal.querySelector('[data-admin-log-body]'),
    };
  }

  modal = document.createElement('div');
  modal.id = 'adminLogModal';
  modal.className = 'admin-log-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="admin-log-modal__backdrop" data-admin-close></div>
    <section class="admin-log-modal__panel" role="dialog" aria-modal="true" aria-label="Admin visitor logs">
      <div class="admin-log-modal__head">
        <h2>Visitor Logs</h2>
        <button type="button" class="btn btn-outline" data-admin-close>Close</button>
      </div>
      <p class="admin-log-modal__status" data-admin-status>Admin access enabled.</p>
      <div class="admin-log-modal__actions">
        <button type="button" class="btn btn-soft" data-admin-clear>Clear Logs</button>
      </div>
      <div class="admin-log-modal__table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Page</th>
              <th>Language</th>
              <th>Platform</th>
              <th>Time Zone</th>
              <th>Referrer</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody data-admin-log-body></tbody>
        </table>
      </div>
    </section>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('[data-admin-close]').forEach((closer) => {
    closer.addEventListener('click', () => {
      modal.hidden = true;
    });
  });

  const clearButton = modal.querySelector('[data-admin-clear]');
  const statusNode = modal.querySelector('[data-admin-status]');
  const bodyNode = modal.querySelector('[data-admin-log-body]');

  if (clearButton && statusNode && bodyNode) {
    clearButton.addEventListener('click', () => {
      const shouldClear = window.confirm('Clear all visitor logs? This cannot be undone.');
      if (!shouldClear) {
        return;
      }

      writeVisitorLogs([]);
      renderVisitorLogs(bodyNode);
      statusNode.textContent = 'Logs cleared.';
    });

    bodyNode.addEventListener('click', (event) => {
      const toggleButton = event.target.closest('button[data-admin-toggle-block]');
      if (!toggleButton) {
        return;
      }

      const visitorId = toggleButton.dataset.adminToggleBlock;
      if (!visitorId || visitorId === '-') {
        return;
      }

      if (visitorId === currentVisitorId) {
        statusNode.textContent = 'Your current visitor cannot be blocked.';
        return;
      }

      const blockedIds = readBlockedVisitorIds();
      const isBlocked = blockedIds.includes(visitorId);

      if (isBlocked) {
        writeBlockedVisitorIds(blockedIds.filter((id) => id !== visitorId));
        statusNode.textContent = `Visitor ${visitorId} unblocked.`;
      } else {
        writeBlockedVisitorIds([...new Set([...blockedIds, visitorId])]);
        statusNode.textContent = `Visitor ${visitorId} blocked.`;
      }

      renderVisitorLogs(bodyNode);
    });
  }

  return {
    modal,
    status: statusNode,
    tableBody: bodyNode,
  };
};

const trackVisitor = () => {
  const sessionFlag = 'portfolio-visit-tracked';
  if (window.sessionStorage.getItem(sessionFlag) === '1') {
    return;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Unknown';
  const entry = {
    visitorId: currentVisitorId,
    timestamp: new Date().toLocaleString(),
    path: window.location.pathname || '/',
    referrer: document.referrer || 'Direct',
    language: navigator.language || 'Unknown',
    platform,
    timeZone,
    screen: `${window.screen.width}x${window.screen.height}`,
    userAgent: navigator.userAgent,
  };

  const logs = readVisitorLogs();
  logs.push(entry);
  const trimmedLogs = logs.slice(-200);
  writeVisitorLogs(trimmedLogs);
  window.sessionStorage.setItem(sessionFlag, '1');
};

trackVisitor();

let adminTypedBuffer = '';
window.addEventListener('keydown', async (event) => {
  const targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
  if (targetTag === 'input' || targetTag === 'textarea') {
    return;
  }

  if (event.key === 'Escape') {
    const modal = document.getElementById('adminLogModal');
    if (modal && !modal.hidden) {
      modal.hidden = true;
    }
    return;
  }

  if (!/^[a-z]$/i.test(event.key)) {
    return;
  }

  adminTypedBuffer += event.key.toLowerCase();
  adminTypedBuffer = adminTypedBuffer.slice(-ADMIN_SECRET_SEQUENCE.length);

  if (adminTypedBuffer !== ADMIN_SECRET_SEQUENCE) {
    return;
  }

  adminTypedBuffer = '';
  const lockRemainingMs = getLockRemainingMs();
  if (lockRemainingMs > 0) {
    const seconds = Math.ceil(lockRemainingMs / 1000);
    window.alert(`Admin access is temporarily locked. Try again in ${seconds}s.`);
    return;
  }

  const enteredPasscode = window.prompt('Enter admin passcode:');
  if (!enteredPasscode) {
    return;
  }

  const isValidPasscode = await verifyAdminPasscode(enteredPasscode);
  if (!isValidPasscode) {
    recordFailedAttempt();
    return;
  }

  clearFailedAttempts();
  writeAdminVisitorId(currentVisitorId);

  const { modal, status, tableBody } = ensureAdminModal();
  if (status) {
    status.textContent = 'Admin access enabled.';
  }
  if (tableBody) {
    renderVisitorLogs(tableBody);
  }
  if (modal) {
    modal.hidden = false;
  }
});

window.addEventListener('click', (event) => {
  const modal = document.getElementById('adminLogModal');
  if (!modal || modal.hidden) {
    return;
  }

  const panel = modal.querySelector('.admin-log-modal__panel');
  if (panel && !panel.contains(event.target)) {
    modal.hidden = true;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    adminTypedBuffer = '';
  }
});

window.addEventListener('blur', () => {
  adminTypedBuffer = '';
});

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
const qualityMode = validQuality ? savedQuality : autoLiteFx ? 'lite' : 'lite';
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

if (starsLayer) {
  const starCount = useLiteFx ? 36 : useBalancedFx ? 64 : 110;

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

  const superstarCount = useLiteFx ? 2 : useBalancedFx ? 4 : 7;
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

if (meteorsLayer && useHighFx) {
  const maxActiveMeteors = 10;

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
    const burstCount = 1 + Math.floor(Math.random() * 2);
    for (let index = 0; index < burstCount; index += 1) {
      const burstGap = 120 + Math.random() * 120;
      window.setTimeout(spawnMeteor, index * burstGap);
    }

    const nextDelay = 800 + Math.random() * 1200;
    window.setTimeout(queueMeteor, nextDelay);
  };

  // Seed a few meteors immediately so the shower is visible as soon as page loads.
  const seedCount = 1;
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

if (useHighFx) {
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
