// Мобильное меню: открытие, закрытие по ссылке и клавише Escape.
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");

function closeMenu() {
  navigation.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Открыть меню");
}

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Закрыть меню" : "Открыть меню",
  );
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuButton.focus();
  }
});

window.matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);

// Плавная прокрутка реализована в CSS через scroll-behavior.
// Нативная проверка required и type="email" выполняется до события submit.
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const message = form.elements.message;

  // Пробелы не считаются заполненным именем или сообщением.
  for (const field of [name, message]) {
    field.setCustomValidity(
      field.value.trim() ? "" : "Пожалуйста, заполните поле.",
    );
  }
  if (!form.reportValidity()) return;

  formStatus.textContent = "Спасибо! Сообщение отправлено.";
  form.reset();
});

form.addEventListener("input", (event) => {
  event.target.setCustomValidity("");
  formStatus.textContent = "";
});

// Небольшое появление секций при прокрутке. Контент доступен и без JS.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("is-pending");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-pending");
    observer.observe(element);
  });
}
