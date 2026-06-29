'use strict';

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
// Native <details> handles open/close; we add smooth height animation.
document.querySelectorAll('.faq-item').forEach((details) => {
  const summary = details.querySelector('summary');
  const content = details.querySelector('p');
  if (!summary || !content) return;

  summary.addEventListener('click', (e) => {
    e.preventDefault();

    if (details.open) {
      // Collapse
      content.style.maxHeight = content.scrollHeight + 'px';
      requestAnimationFrame(() => {
        content.style.transition = 'max-height .25s ease, opacity .2s ease';
        content.style.maxHeight = '0';
        content.style.opacity = '0';
      });
      content.addEventListener('transitionend', function handler() {
        details.open = false;
        content.style.removeProperty('max-height');
        content.style.removeProperty('opacity');
        content.style.removeProperty('transition');
        content.removeEventListener('transitionend', handler);
      });
    } else {
      // Expand
      details.open = true;
      content.style.maxHeight = '0';
      content.style.opacity = '0';
      requestAnimationFrame(() => {
        content.style.transition = 'max-height .3s ease, opacity .25s ease';
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.opacity = '1';
      });
      content.addEventListener('transitionend', function handler() {
        content.style.removeProperty('max-height');
        content.style.removeProperty('opacity');
        content.style.removeProperty('transition');
        content.removeEventListener('transitionend', handler);
      });
    }
  });
});

// ─── Smooth-scroll for nav links ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─── Scroll-triggered fade-up ────────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-up, .fade-up-2, .fade-up-3').forEach((el) => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

// ─── Active nav highlight on scroll ─────────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

function updateActiveNav() {
  let current = '';
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 120) {
      current = section.id;
    }
  });
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === '#' + current;
    link.style.color = active ? 'var(--text)' : '';
    link.style.fontWeight = active ? '600' : '';
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

// ─── Language badge hover glow ────────────────────────────────────────────────
document.querySelectorAll('.lang-badge').forEach((badge) => {
  const colors = ['#4f86f7', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#f97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  badge.addEventListener('mouseenter', () => {
    badge.style.borderColor = color;
    badge.style.color = color;
    badge.style.background = color + '11';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.removeProperty('border-color');
    badge.style.removeProperty('color');
    badge.style.removeProperty('background');
  });
});
