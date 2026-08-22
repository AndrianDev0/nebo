const modal = document.querySelector('#booking-modal');
const bookingCopy = document.querySelector('#booking-copy');
const mobileNav = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');
const navClose = document.querySelector('.nav-close');
const mobileBook = document.querySelector('.mobile-book');
const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

document.documentElement.classList.add('motion-ready');

function updateMobileBookingVisibility() {
  if (!mobileBook || !hero) return;
  const revealPoint = Math.max(180, hero.offsetHeight - Math.min(140, window.innerHeight * 0.16));
  mobileBook.classList.toggle('visible', window.scrollY > revealPoint);
}

window.addEventListener('scroll', updateMobileBookingVisibility, { passive: true });
window.addEventListener('resize', updateMobileBookingVisibility, { passive: true });
updateMobileBookingVisibility();

function openModal(room = '') {
  bookingCopy.textContent = room
    ? `Свяжитесь с командой NEBO, чтобы уточнить свободное время для «${room}».`
    : 'Выберите способ связи — команда NEBO поможет подобрать стол и время.';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lock');
}

document.querySelectorAll('[data-book]').forEach(button => {
  button.addEventListener('click', () => openModal(button.dataset.room || ''));
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModal));

function closeNav() {
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('lock');
}

menuToggle.addEventListener('click', () => {
  mobileNav.classList.add('open');
  mobileNav.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('lock');
});
navClose.addEventListener('click', closeNav);
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
    closeNav();
  }
});

const menuData = {
  main: {
    kicker: 'Баланс Азии и Европы',
    title: 'Море, огонь<br>и точность',
    description: 'Сашими, роллы, морепродукты, вок и робата — знакомые вкусы в авторском прочтении шефа.',
    image: 'https://neborest.com/wp-content/uploads/2024/03/MG_7913-HDR-scaled.jpg',
    href: 'https://neborest.com/wp-content/uploads/2026/03/Основное-меню_небо_печать.pdf'
  },
  wine: {
    kicker: 'Старая и новая классика',
    title: 'Вино<br>к моменту',
    description: 'Коллекция, собранная вокруг гастрономии NEBO: от выразительных игристых до глубоких красных вин.',
    image: 'https://neborest.com/wp-content/uploads/2024/03/MG_7895-HDR-2-scaled.jpg',
    href: 'https://neborest.com/wp-content/uploads/2026/06/Винная-карта_Небо_печать.pdf'
  },
  special: {
    kicker: 'Сезонное предложение',
    title: 'Новый вкус<br>каждый сезон',
    description: 'Короткое меню из продуктов в лучшей форме — специальные блюда и сочетания, доступные ограниченное время.',
    image: 'https://neborest.com/wp-content/uploads/2024/03/MG_7937-HDR-scaled.jpg',
    href: 'https://neborest.com/wp-content/uploads/2026/03/Special-весна-26-НЕБО.pdf'
  }
};

const menuShowcase = document.querySelector('.menu-showcase');
const menuPhoto = document.querySelector('#menu-photo');
let menuSwitchTimer;

document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.setAttribute('aria-selected', String(tab.classList.contains('active')));
  tab.addEventListener('click', () => {
    const data = menuData[tab.dataset.menu];
    if (!data || tab.classList.contains('active')) return;

    document.querySelectorAll('.menu-tab').forEach(item => {
      const isActive = item === tab;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });

    window.clearTimeout(menuSwitchTimer);
    menuShowcase.classList.add('is-switching');
    menuSwitchTimer = window.setTimeout(() => {
      document.querySelector('#menu-kicker').textContent = data.kicker;
      document.querySelector('#menu-title').innerHTML = data.title;
      document.querySelector('#menu-description').textContent = data.description;
      menuPhoto.src = data.image;
      document.querySelector('#menu-link').href = data.href;
      requestAnimationFrame(() => requestAnimationFrame(() => menuShowcase.classList.remove('is-switching')));
    }, reduceMotion.matches ? 0 : 180);
  });
});

Object.values(menuData).forEach(item => {
  const image = new Image();
  image.src = item.image;
});

const motionGroups = document.querySelectorAll('.intro.reveal, .menu-section .shell.reveal, .atmosphere .shell.reveal, .contacts-grid.reveal');
motionGroups.forEach(group => {
  group.classList.add('motion-group');
  [...group.children].forEach((child, index) => child.style.setProperty('--motion-delay', `${index * 90}ms`));
});

document.querySelectorAll('.space-card.reveal, .event-card.reveal').forEach((element, index) => {
  element.style.setProperty('--motion-delay', `${(index % 2) * 100}ms`);
});

const revealElements = [...document.querySelectorAll('.reveal')];
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
  revealElements.forEach(element => observer.observe(element));
}

const motionFrames = [...document.querySelectorAll('.image-frame, .map-card, .final-booking')];
motionFrames.forEach(frame => frame.classList.add('motion-frame'));
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  motionFrames.forEach(frame => frame.classList.add('frame-visible'));
} else {
  const frameObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('frame-visible');
        frameObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  motionFrames.forEach(frame => frameObserver.observe(frame));
}

const spacesGrid = document.querySelector('.spaces-grid');
const spacesCurrent = document.querySelector('#spaces-current');

if (spacesGrid && spacesCurrent) {
  const cards = [...spacesGrid.querySelectorAll('.space-card')];
  let scrollFrame;

  const updateActiveSpace = () => {
    const center = spacesGrid.scrollLeft + spacesGrid.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const currentDistance = Math.abs(center - cardCenter);
      if (currentDistance < distance) {
        distance = currentDistance;
        nearest = index;
      }
    });

    cards.forEach((card, index) => card.classList.toggle('is-current', index === nearest));
    spacesCurrent.textContent = String(nearest + 1).padStart(2, '0');
  };

  spacesGrid.addEventListener('scroll', () => {
    document.querySelector('.spaces')?.classList.add('has-interacted');
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateActiveSpace);
  }, { passive: true });

  updateActiveSpace();
}

document.querySelectorAll('.mobile-nav a').forEach((link, index) => {
  link.style.setProperty('--nav-delay', `${110 + index * 55}ms`);
});

const progress = document.createElement('div');
progress.className = 'page-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);

let scrollTicking = false;
function updateScrollMotion() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.style.setProperty('--page-progress', String(Math.min(1, window.scrollY / maxScroll)));

  if (!reduceMotion.matches && hero) {
    const heroDistance = Math.min(window.scrollY, hero.offsetHeight);
    hero.style.setProperty('--hero-scroll', `${heroDistance * 0.11}px`);
    hero.style.setProperty('--hero-copy-scroll', `${heroDistance * 0.035}px`);
  }

  scrollTicking = false;
}

function requestScrollMotion() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollMotion);
}

window.addEventListener('scroll', requestScrollMotion, { passive: true });
window.addEventListener('resize', requestScrollMotion, { passive: true });
updateScrollMotion();

if (!reduceMotion.matches && finePointer.matches) {
  document.querySelectorAll('.button, .map-open, .card-action').forEach(action => {
    action.classList.add('motion-action');
    action.addEventListener('pointermove', event => {
      const rect = action.getBoundingClientRect();
      action.style.setProperty('--motion-x', `${(event.clientX - rect.left - rect.width / 2) * 0.08}px`);
      action.style.setProperty('--motion-y', `${(event.clientY - rect.top - rect.height / 2) * 0.12}px`);
    });
    action.addEventListener('pointerleave', () => {
      action.style.setProperty('--motion-x', '0px');
      action.style.setProperty('--motion-y', '0px');
    });
  });

  document.querySelectorAll('.space-card').forEach(card => {
    const visual = card.querySelector('.space-image');
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      visual.style.setProperty('--card-tilt-x', `${y * -2.4}deg`);
      visual.style.setProperty('--card-tilt-y', `${x * 3}deg`);
    });
    card.addEventListener('pointerleave', () => {
      visual.style.setProperty('--card-tilt-x', '0deg');
      visual.style.setProperty('--card-tilt-y', '0deg');
    });
  });
}
