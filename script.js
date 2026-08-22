const modal = document.querySelector('#booking-modal');
const bookingCopy = document.querySelector('#booking-copy');
const mobileNav = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');
const navClose = document.querySelector('.nav-close');
const mobileBook = document.querySelector('.mobile-book');
const hero = document.querySelector('.hero');

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

document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const data = menuData[tab.dataset.menu];
    document.querySelectorAll('.menu-tab').forEach(item => item.classList.toggle('active', item === tab));
    document.querySelector('#menu-kicker').textContent = data.kicker;
    document.querySelector('#menu-title').innerHTML = data.title;
    document.querySelector('#menu-description').textContent = data.description;
    document.querySelector('#menu-photo').src = data.image;
    document.querySelector('#menu-link').href = data.href;
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

const spacesGrid = document.querySelector('.spaces-grid');
const spacesCurrent = document.querySelector('#spaces-current');

if (spacesGrid && spacesCurrent) {
  const cards = [...spacesGrid.querySelectorAll('.space-card')];
  let scrollFrame;

  spacesGrid.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
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

      spacesCurrent.textContent = String(nearest + 1).padStart(2, '0');
    });
  }, { passive: true });

}
