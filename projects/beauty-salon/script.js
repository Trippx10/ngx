'use strict';

// Этот класс включает мобильное меню, только если JavaScript работает.
document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobileScreen = window.matchMedia('(max-width: 860px)');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
  navigation.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});

// При переходе на широкое окно снимаем блокировку прокрутки.
mobileScreen.addEventListener('change', closeMenu);
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});
document.addEventListener('focusin', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});

// Плавную прокрутку выполняет CSS (scroll-behavior).
// Обычные якорные ссылки сохраняют работу навигации без JavaScript.

const bookingForm = document.querySelector('#booking-form');
const nameInput = document.querySelector('#name');
const phoneInput = document.querySelector('#phone');
const successMessage = document.querySelector('#form-success');

function validateName() {
  nameInput.setCustomValidity(nameInput.value.trim().length < 2 ? 'Укажите имя: не менее двух символов.' : '');
}

function validatePhone() {
  const phone = phoneInput.value.trim();
  const digits = phone.replace(/\D/g, '');
  const isValid = /^\+?[\d\s()\-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15;
  phoneInput.setCustomValidity(isValid ? '' : 'Укажите телефон: от 10 до 15 цифр.');
}

nameInput.addEventListener('input', validateName);
phoneInput.addEventListener('input', validatePhone);

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  validateName();
  validatePhone();
  if (!bookingForm.reportValidity()) return;

  // Демонстрация без сервера: ничего не отправляем и не сохраняем.
  bookingForm.hidden = true;
  successMessage.hidden = false;
  successMessage.focus({ preventScroll: true });
  bookingForm.reset();
});

document.querySelector('#reset-form').addEventListener('click', () => {
  successMessage.hidden = true;
  bookingForm.hidden = false;
  nameInput.setCustomValidity('');
  phoneInput.setCustomValidity('');
  nameInput.focus({ preventScroll: true });
});

// Однократное появление блоков. Старые браузеры просто покажут весь контент.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('is-pending');
    revealObserver.observe(element);
  });
}
