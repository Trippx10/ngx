/* ==========================================================================
   НАСТРОЙКИ ПОРТФОЛИО — всё, что нужно менять, находится в этом файле.
   ==========================================================================

   1. Ссылки на проекты: поле `url` у каждого проекта.
      Сейчас они ведут на копии сайтов в папке portfolio/projects/.
      После публикации замени на реальные адреса, например:
      url: 'https://barbershop.example.com'

   2. Живое превью (iframe) внутри кейса берёт адрес из `previewUrl`
      (если пусто — из `url`). Если сайт запрещает показ в iframe,
      поставь livePreview: false — останутся скриншоты.

   3. Картинки лежат в папке assets/. Чтобы заменить превью,
      положи свой файл и поменяй путь в `cover`, `mobile` или `gallery`.
   ========================================================================== */

window.PORTFOLIO = {
  /* ---------- Кто вы ---------- */
  name: 'NGX',                 // имя или название студии (логотип, footer)
  role: 'Web Design & Development',
  year: 2026,

  /* ---------- Контакты (замени на свои) ---------- */
  contacts: {
    email: 'dkolotov23@gmail.com',             // ← основная почта
    email2: 'ivankalyakin345@gmail.com',       // ← вторая почта (показывается под первой)
    telegram: 'https://t.me/tr1ppx1',          // ← основной Telegram (кнопка «Обсудить проект»)
    telegram2: 'https://t.me/jung1e12',        // ← второй Telegram (показывается под первым)
  },
  socials: [
    // { label: 'Telegram', url: 'https://t.me/username' },
    // { label: 'Behance',  url: 'https://www.behance.net/username' },
    // { label: 'GitHub',   url: 'https://github.com/username' },
    { label: '@tr1ppx1', url: 'https://t.me/tr1ppx1' },
    { label: '@jung1e12', url: 'https://t.me/jung1e12' },
    { label: 'Email', url: 'mailto:dkolotov23@gmail.com' },
  ],

  /* ---------- Технологии (легко редактировать) ----------
     main  — основной стек.
     extra — то, что встречается в проектах портфолио.
     Добавляй / удаляй строки как нужно, например 'React', 'Next.js'. */
  tech: {
    main: ['HTML', 'CSS', 'JavaScript'],
    extra: ['Python', 'FastAPI', 'PostgreSQL', 'Telegram Mini Apps'],
  },

  /* ---------- Проекты ---------- */
  projects: [
    {
      id: 'barbershop',
      title: 'BARBERSHOP',
      subtitle: 'Сайт барбершопа',
      category: ['Website', 'Branding', 'UX'],
      accent: '#ff5fa2',
      bg: '#16111a',
      url: 'projects/barbershop-name/index.html',     // ← реальный URL проекта
      previewUrl: '',
      livePreview: true,
      cover: 'assets/barbershop-cover.webp',
      mobile: 'assets/barbershop-mobile.webp',
      gallery: ['assets/barbershop-s1.webp', 'assets/barbershop-s2.webp', 'assets/barbershop-s3.webp', 'assets/barbershop-s4.webp'],
      short: 'Современный сайт барбершопа с акцентом на визуальную подачу, атмосферу и удобную запись.',
      task: 'Передать характер места через дерзкую визуальную подачу и довести посетителя от первого экрана до записи к мастеру.',
      features: [
        'Фирменный маскот и анимированные иллюстрации',
        'Прайс с закреплённым заголовком: клик по услуге открывает запись',
        'Галерея работ с ползунком «до / после»',
        'Интерактивные карточки мастеров с наклоном за курсором',
        'Боковая навигация по разделам и горячие клавиши',
        'Мини-игра, слайдер отзывов, карта и онлайн-запись',
      ],
      stack: ['HTML', 'CSS', 'JavaScript'],
      note: 'Чистый код без библиотек и сборки.',
    },
    {
      id: 'rebuild',
      title: 'REBUILD WORKSHOP',
      subtitle: 'Сайт кузовной мастерской',
      category: ['Website', 'UI', 'Animation'],
      accent: '#c935e0',
      bg: '#0c1312',
      url: 'projects/rebuild-workshop/index.html',  // ← реальный URL проекта
      previewUrl: '',
      livePreview: true,
      cover: 'assets/rebuild-cover.webp',
      mobile: 'assets/rebuild-mobile.webp',
      gallery: ['assets/rebuild-s1.webp', 'assets/rebuild-s2.webp', 'assets/rebuild-s3.webp', 'assets/rebuild-s4.webp'],
      short: 'Яркий сайт мастерской кузовного ремонта и покраски: работы «до / после», расчёт стоимости по фото и запись.',
      task: 'Передать характер мастерской через фирменную эстетику с неоновыми брызгами краски и привести владельца авто от первого экрана к расчёту и записи на ремонт.',
      features: [
        'Слайдер «До / После» с несколькими автомобилями',
        'Калькулятор примерной стоимости ремонта по фото',
        'Пять этапов работы от осмотра до выдачи',
        'Галерея работ с фильтрами по видам ремонта',
        'Карта, отзывы и форма записи на ремонт',
        'Светлая и тёмная тема, анимированный механик-помощник',
      ],
      stack: ['HTML', 'CSS', 'JavaScript'],
      note: 'Один файл без библиотек и сборки.',
    },
    {
      id: 'beauty',
      title: 'BEAUTY SALON',
      subtitle: 'Сайт салона красоты',
      category: ['Website', 'UI', 'UX'],
      accent: '#a88466',
      bg: '#efe8df',
      light: true,
      url: 'projects/beauty-salon/index.html',        // ← реальный URL проекта
      previewUrl: '',
      livePreview: true,
      cover: 'assets/beauty-cover.webp',
      mobile: 'assets/beauty-mobile.webp',
      gallery: ['assets/beauty-s1.webp', 'assets/beauty-s2.webp', 'assets/beauty-s3.webp', 'assets/beauty-s4.webp'],
      short: 'Спокойный, воздушный сайт студии красоты: услуги, мастера и запись в пару касаний.',
      task: 'Создать ощущение заботы и премиальности, понятно показать услуги и цены и сделать запись максимально простой.',
      features: [
        'Каталог услуг с ценами',
        'Блок мастеров с фотографиями',
        'Отзывы клиентов',
        'Форма записи с проверкой полей',
        'Адаптивное мобильное меню',
        'Анимации появления с учётом reduced motion',
      ],
      stack: ['HTML', 'CSS', 'JavaScript'],
      note: 'Адаптивная вёрстка без сторонних библиотек.',
    },
    {
      id: 'fastfood',
      title: 'FAST FOOD',
      subtitle: 'Сайт фаст-фуда',
      category: ['Web App', 'UI', 'Animation'],
      accent: '#ff5a1f',
      bg: '#ff5a1f',
      phoneLayout: true,                        // превью в виде экранов телефона
      url: 'projects/fastfood-demo/index.html', // ← демо-версия; замени на публичный URL, когда он будет
      previewUrl: 'projects/fastfood-demo/index.html', // приложение в кейсе, работает на демо-данных без сервера
      livePreview: true,
      cover: 'assets/fastfood-mobile.webp',
      mobile: 'assets/fastfood-mobile.webp',
      gallery: ['assets/fastfood-mobile.webp', 'assets/fastfood-mobile-2.webp', 'assets/fastfood-mobile-3.webp', 'assets/fastfood-mobile-4.webp'],
      short: 'Динамичное мобильное меню фаст-фуда внутри Telegram: каталог, корзина и оформление заказа.',
      task: 'Сделать быстрый путь от выбора блюда до заказа в привычном мессенджере и дать персоналу удобный поток заказов.',
      features: [
        'Меню по категориям с карточками блюд',
        'Режимы «Доставка» и «В ресторане»',
        'Корзина и оформление заказа',
        'Отслеживание статуса заказа',
        'Уведомления о заказах в Telegram с кнопками статусов',
        'Собственный API и база данных',
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Python', 'FastAPI', 'PostgreSQL', 'Telegram Mini Apps'],
      note: 'Frontend + backend: меню и заказы работают через API.',
    },
    {
      id: 'trainer',
      title: 'FITNESS TRAINER',
      subtitle: 'Сайт персонального тренера',
      category: ['Website', 'UI', 'Animation'],
      accent: '#d7192a',
      bg: '#1c0d10',
      url: 'projects/trainer-site/index.html',  // ← реальный URL проекта
      previewUrl: '',
      livePreview: true,
      cover: 'assets/trainer-cover.webp',
      mobile: 'assets/trainer-mobile.webp',
      gallery: ['assets/trainer-s1.webp', 'assets/trainer-s2.webp', 'assets/trainer-s3.webp', 'assets/trainer-s4.webp'],
      short: 'Строгий и энергичный сайт персонального тренера: направления, план работы, результаты и тарифы.',
      task: 'Показать системный подход тренера через подачу «тренировочного журнала» и привести посетителя к записи на первую тренировку.',
      features: [
        'Сетка в стиле тренировочного журнала',
        'Шесть направлений тренировок с параметрами циклов',
        'План работы в виде бланка со шкалами нагрузки',
        'Блок результатов и отзывов клиентов',
        'Тарифы и раскрывающиеся ответы на частые вопросы',
        'Анимированные счётчики, параллакс и бегущая строка',
      ],
      stack: ['HTML', 'CSS', 'JavaScript'],
      note: 'Имя, контакты, цены и фото меняются в одном блоке настроек.',
    },
    {
      id: 'beautybot',
      title: 'BEAUTY BOT',
      subtitle: 'Telegram-бот студии косметологии',
      category: ['Telegram Bot', 'UX', 'Booking'],
      accent: '#b08f74',
      bg: '#ede4dc',
      light: true,
      botLayout: true,                          // карточка: логотип + смартфон со скриншотом бота
      url: 'https://t.me/annanas_beauty_bot',   // ← ссылка на бота
      previewUrl: '',
      livePreview: false,
      cover: 'assets/beautybot-logo.webp',
      mobile: 'assets/beautybot-1.webp',
      phoneShot: 'assets/beautybot-phone.webp', // экран смартфона на карточке
      gallery: ['assets/beautybot-1.webp', 'assets/beautybot-2.webp', 'assets/beautybot-3.webp', 'assets/beautybot-4.webp', 'assets/beautybot-5.webp', 'assets/beautybot-6.webp'],
      short: 'Telegram-бот студии косметологии: услуги с ценами, онлайн-запись по шагам и информация о мастере.',
      task: 'Дать клиентам студии записаться на процедуру прямо в Telegram — без звонков и переписки, в несколько нажатий.',
      features: [
        'Главное меню с фирменным оформлением',
        'Каталог процедур с описанием, длительностью и ценой',
        'Запись в 5 шагов: процедура, дата, время, контакты, подтверждение',
        'Календарь свободных дней и выбор времени',
        'Раздел «Мои записи»',
        'Информация о косметологе, адрес и контакты',
      ],
      stack: ['Telegram Bot API', 'Inline-клавиатуры'],
      note: 'Сообщения бота обновляются на месте — переписка не засоряется.',
    },
    {
      id: 'blogger',
      title: 'BLOGGER',
      subtitle: 'Персональный сайт блогера',
      category: ['Website', 'Personal Brand', 'UI'],
      accent: '#d4f25a',
      bg: '#161616',
      url: 'projects/blogger-website/index.html',     // ← реальный URL проекта
      previewUrl: '',
      livePreview: true,
      cover: 'assets/blogger-cover.webp',
      mobile: 'assets/blogger-mobile.webp',
      gallery: ['assets/blogger-s1.webp', 'assets/blogger-s2.webp', 'assets/blogger-s3.webp', 'assets/blogger-s4.webp'],
      short: 'Смелый персональный сайт автора: контент, соцсети и заявки на сотрудничество в одном месте.',
      task: 'Собрать личный бренд в одну выразительную страницу, которая показывает контент и приводит к сотрудничеству.',
      features: [
        'Выразительный первый экран с портретом',
        'Блок «Обо мне» с ключевыми цифрами',
        'Лента публикаций с раскрывающимися карточками',
        'Карточки соцсетей',
        'Форма для предложений о сотрудничестве',
        'Бегущая строка и акцентная типографика',
      ],
      stack: ['HTML', 'CSS', 'JavaScript'],
      note: 'Лёгкая страница без сборки и зависимостей.',
    },
  ],
};
