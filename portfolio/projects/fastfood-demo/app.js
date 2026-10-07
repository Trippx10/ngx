
(function(){
  "use strict";

  var API_URL = (window.APP_CONFIG.API_URL || '').replace(/\/$/, '');
  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  var submitting = false, polling = false, currentUser = null;
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }
  async function api(path, options) {
    options = options || {};
    options.headers = Object.assign({'Content-Type':'application/json'}, options.headers || {});
    if (tg && tg.initData) options.headers['X-Telegram-Init-Data'] = tg.initData;
    var response;
    try { response = await fetch(API_URL + path, Object.assign({signal:AbortSignal.timeout(15000)}, options)); }
    catch(e) { throw new Error('Нет связи с сервером. Проверьте подключение.'); }
    if (!response.ok) {
      var body = await response.json().catch(function(){ return {}; });
      throw new Error(typeof body.detail === 'string' ? body.detail : 'Проверьте данные формы (' + response.status + ')');
    }
    return response.status === 204 ? null : response.json();
  }
  function dishMedia(item) {
    if (item.image_url && /^https?:\/\//i.test(item.image_url)) return '<img alt="" loading="lazy" src="' + escapeHtml(item.image_url) + '">';
    return ICONS[item.icon] || ICONS.burger;
  }
  function saveCart() {
    try { localStorage.setItem('zh_cart_v1', JSON.stringify(Object.keys(state.cart).map(function(id){
      var dish = menuById(id); return dish && {id:id,name:dish.name,price:dish.price,quantity:state.cart[id]};
    }).filter(Boolean))); } catch(e) {}
  }
  function restoreCart() {
    try {
      var saved = JSON.parse(localStorage.getItem('zh_cart_v1') || '[]');
      if (Array.isArray(saved)) saved.forEach(function(row){
        if (row && menuById(String(row.id)) && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99) state.cart[String(row.id)] = row.quantity;
      });
    } catch(e) {}
  }
  async function loadMenu() {
    document.getElementById('menuMessage').textContent = 'Загружаем меню…';
    try {
      var results = await Promise.all([api('/menu'), api('/categories')]);
      var styles = {'Комбо':['cat-combo','combo'], 'Бургеры':['cat-burgers','burger'], 'Картофель':['cat-fries','fries'], 'Снеки':['cat-snacks','nuggets'], 'Напитки':['cat-drinks','lemon'], 'Десерты':['cat-desserts','brownie']};
      MENU = results[0].map(function(d){
        var style = styles[d.category.name] || ['cat-burgers','burger'];
        CATEGORY_CLASS[String(d.category_id)] = style[0];
        return {id:String(d.id),name:d.name,desc:d.description,price:Number(d.price),cat:String(d.category_id),icon:style[1],image_url:d.image_url};
      });
      chipsRow.innerHTML = '';
      var categories = results[1];
      if (!categories.some(function(c){ return String(c.id) === state.activeCategory; })) state.activeCategory = categories.length ? String(categories[0].id) : '';
      categories.forEach(function(c){
        var button = document.createElement('button'); button.type = 'button'; button.className = 'chip category-chip';
        button.textContent = c.name; button.dataset.cat = String(c.id);
        button.classList.toggle('active', button.dataset.cat === state.activeCategory);
        button.addEventListener('click', function(){
          state.activeCategory = button.dataset.cat;
          chipsRow.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b === button); });
          renderGrid();
        });
        chipsRow.appendChild(button);
      });
      state.cart = {}; restoreCart(); renderGrid(); syncCartUI();
      document.getElementById('menuMessage').textContent = MENU.length ? '' : 'В меню пока нет доступных блюд.';
      document.getElementById('retryMenu').hidden = true;
    } catch(e) {
      document.getElementById('menuMessage').textContent = e.message;
      document.getElementById('retryMenu').hidden = false;
    }
  }
  async function openDish(id) {
    try {
      var dish = await api('/menu/' + id);
      document.getElementById('dishName').textContent = dish.name;
      document.getElementById('dishDescription').textContent = dish.description;
      document.getElementById('dishPrice').textContent = money(Number(dish.price));
      document.getElementById('dishAdd').onclick = function(){ changeQty(id, 1); renderGrid(); document.getElementById('dishDialog').close(); };
      document.getElementById('dishDialog').showModal();
    } catch(e) { showToast(e.message); }
  }
  async function submitOrder() {
    if (submitting || !cartCount()) return;
    if (!currentUser) { showToast('Откройте приложение через Telegram'); return; }
    if (!document.getElementById('customerForm').reportValidity()) return;
    var address = currentMode === 'dine-in' ? LOCATIONS.m1.name : document.getElementById('deliveryAddressInput').value.trim();
    if (address.length < 3) { showToast('Укажите адрес доставки'); return; }
    submitting = true; syncCartUI();
    document.getElementById('checkoutMessage').textContent = 'Отправляем заказ…';
    try {
      var order = await api('/orders', {method:'POST', body:JSON.stringify({
        user: {telegram_id:currentUser.id, username:currentUser.username || null, first_name:currentUser.first_name || null, last_name:currentUser.last_name || null},
        items:Object.keys(state.cart).map(function(id){ return {dish_id:Number(id), quantity:state.cart[id]}; }),
        customer_name:document.getElementById('customerName').value.trim(), phone:document.getElementById('customerPhone').value.trim(),
        address:address, comment:document.getElementById('customerComment').value.trim(), fulfillment:currentMode
      })});
      state.activeOrder = {number:order.id,address:order.address,total:Number(order.total_price)};
      state.cart = {}; saveCart(); renderGrid();
      var message = 'Заказ №' + order.id + ' успешно создан';
      document.getElementById('checkoutMessage').textContent = message; showToast(message);
      addOrdersTab(); renderOrderDetails(); startOrderStatusTimer(); switchTab('orders');
      await loadOrders();
    } catch(e) { document.getElementById('checkoutMessage').textContent = e.message + ' Перед повторной отправкой проверьте историю заказов.'; }
    finally { submitting = false; syncCartUI(); }
  }
  async function loadOrders() {
    try {
      var orders = await api('/orders');
      state.orders = orders.map(function(o){ return {date:new Date(o.created_at).toLocaleString('ru-RU'), items:'№' + o.id + ' · ' + o.items.map(function(i){ return i.dish_name + ' × ' + i.quantity; }).join(', '),total:Number(o.total_price)}; });
      renderOrders();
      if (!state.activeOrder) {
        var active = orders.find(function(o){ return !['completed','cancelled'].includes(o.status); });
        if (active) { state.activeOrder = {number:active.id,address:active.address,total:Number(active.total_price)}; addOrdersTab(); renderOrderDetails(); startOrderStatusTimer(); }
      }
    } catch(e) { orderHistoryEl.textContent = e.message; }
  }
  async function initialize() {
    document.getElementById('retryMenu').onclick = initialize;
    document.getElementById('closeDish').onclick = function(){ document.getElementById('dishDialog').close(); };
    document.getElementById('clearCart').onclick = function(){ if (!submitting) { state.cart = {}; syncCartUI(); renderGrid(); } };
    try {
      var config = await api('/config');
      FREE_DELIVERY_FROM = config.free_delivery_from; BASE_DELIVERY_FEE = config.delivery_fee;
      LOCATIONS.m1.name = config.restaurant_address;
      currentUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (!currentUser && config.development) currentUser = {id:123456789, first_name:'Тестовый пользователь'};
      document.getElementById('profileName').textContent = currentUser ? currentUser.first_name : 'Гость';
      if (!document.getElementById('customerName').value) document.getElementById('customerName').value = currentUser ? currentUser.first_name : '';
      await loadMenu();
      if (currentUser) await loadOrders();
    } catch(e) { document.getElementById('menuMessage').textContent = e.message; document.getElementById('retryMenu').hidden = false; }
  }

  /* ---------------- Data ---------------- */
  var ICONS = {
    burger: '<svg viewBox="0 0 48 48" fill="none"><path d="M8 20c0-6 7-9 16-9s16 3 16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="15" r="0.9" fill="currentColor"/><circle cx="24" cy="13" r="0.9" fill="currentColor"/><circle cx="30" cy="15" r="0.9" fill="currentColor"/><path d="M6 22h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 27.5c6 3 28 3 34 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="6" y="30.5" width="36" height="6" rx="3" stroke="currentColor" stroke-width="2"/><path d="M8 39c8 4 24 4 32 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fries: '<svg viewBox="0 0 48 48" fill="none"><path d="M14 22h20l-2.2 20.2a2 2 0 0 1-2 1.8H18.2a2 2 0 0 1-2-1.8L14 22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13 22l-1-4h24l-1 4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="18" y1="9" x2="18" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="5" x2="24" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="9" x2="30" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    twister: '<svg viewBox="0 0 48 48" fill="none"><path d="M16 42c-3-9 6-8 3-17s6-8 3-17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M25 42c-3-9 6-8 3-17s6-8 3-17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    wedges: '<svg viewBox="0 0 48 48" fill="none"><path d="M10 40 20 8l6 32Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M22 40 30 12l6 28Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    nuggets: '<svg viewBox="0 0 48 48" fill="none"><ellipse cx="17" cy="29" rx="9" ry="7" stroke="currentColor" stroke-width="2"/><ellipse cx="31" cy="27" rx="9" ry="7" stroke="currentColor" stroke-width="2"/><ellipse cx="24" cy="17" rx="8" ry="6.5" stroke="currentColor" stroke-width="2"/></svg>',
    onion: '<svg viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="19" rx="14" ry="8" stroke="currentColor" stroke-width="2"/><ellipse cx="24" cy="19" rx="7" ry="4" stroke="currentColor" stroke-width="2"/><ellipse cx="24" cy="30" rx="14" ry="8" stroke="currentColor" stroke-width="2"/><ellipse cx="24" cy="30" rx="7" ry="4" stroke="currentColor" stroke-width="2"/></svg>',
    cheese: '<svg viewBox="0 0 48 48" fill="none"><path d="M8 35 35 12l6 23Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="21" cy="27" r="1.5" fill="currentColor"/><circle cx="28" cy="22" r="1.5" fill="currentColor"/></svg>',
    lemon: '<svg viewBox="0 0 48 48" fill="none"><path d="M14 16h20l-3 24a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2L14 16Z" stroke="currentColor" stroke-width="2"/><path d="M13 16h22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="27" y1="8" x2="22" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    shake: '<svg viewBox="0 0 48 48" fill="none"><path d="M16 20h16l-2 20a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2L16 20Z" stroke="currentColor" stroke-width="2"/><path d="M14 20c0-4 4.5-7 10-7s10 3 10 7" stroke="currentColor" stroke-width="2"/><line x1="24" y1="6" x2="24" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    coffee: '<svg viewBox="0 0 48 48" fill="none"><path d="M15 18h18l-2.5 22a2 2 0 0 1-2 1.8H19.5a2 2 0 0 1-2-1.8L15 18Z" stroke="currentColor" stroke-width="2"/><line x1="14" y1="18" x2="34" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="10" x2="26" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    berry: '<svg viewBox="0 0 48 48" fill="none"><path d="M16 20h16l-2 20a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2L16 20Z" stroke="currentColor" stroke-width="2"/><line x1="15" y1="20" x2="33" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="12" r="2.3" fill="currentColor"/><circle cx="27" cy="10" r="2.3" fill="currentColor"/></svg>',
    brownie: '<svg viewBox="0 0 48 48" fill="none"><rect x="12" y="16" width="24" height="18" rx="3" stroke="currentColor" stroke-width="2"/><path d="M14 22c4 2 8-3 12-1s6 4 10 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    tart: '<svg viewBox="0 0 48 48" fill="none"><path d="M10 26a14 14 0 0 1 28 0Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 26h28v6a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2Z" stroke="currentColor" stroke-width="2"/></svg>',
    muffin: '<svg viewBox="0 0 48 48" fill="none"><path d="M14 22c0-5 4.5-9 10-9s10 4 10 9Z" stroke="currentColor" stroke-width="2"/><path d="M11 22h26l-2.5 12a2 2 0 0 1-2 1.6H15.5a2 2 0 0 1-2-1.6Z" stroke="currentColor" stroke-width="2"/><line x1="14" y1="26" x2="34" y2="26" stroke="currentColor" stroke-width="1.4"/><line x1="15" y1="30" x2="33" y2="30" stroke="currentColor" stroke-width="1.4"/></svg>',
    combo: '<svg viewBox="0 0 48 48" fill="none"><path d="M6 36h36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="25" r="6.5" stroke="currentColor" stroke-width="2"/><path d="M27 36l3-13h4l3 13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M39 21h4v15h-4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  var HEART_OUTLINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.6-4.7-10-9.3C.4 7.7 2.4 4 6.2 4c2.1 0 3.8 1.1 4.8 2.7C12 5.1 13.7 4 15.8 4c3.8 0 5.8 3.7 4.2 7.2-2.4 4.6-10 9.3-10 9.3Z"/></svg>';
  var HEART_FILLED = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.6-4.7-10-9.3C.4 7.7 2.4 4 6.2 4c2.1 0 3.8 1.1 4.8 2.7C12 5.1 13.7 4 15.8 4c3.8 0 5.8 3.7 4.2 7.2-2.4 4.6-10 9.3-10 9.3Z"/></svg>';

  var ORDER_STAGE_ICONS = {
    preparing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1.2 2 .4 3-.3 4-.9 1.2-.9 2.6 0 3.6"/><path d="M16 5c1.2 2 .4 3-.3 4-.6.8-.8 1.7-.5 2.6"/><path d="M4 21v-6a8 8 0 0 1 16 0v6"/><path d="M4 21h16"/></svg>',
    courier: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="9" width="11" height="7"/><path d="M13.5 12h4l3 3v1h-7z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/></svg>',
    arriving: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
    delivered: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>'
  };

  var CATEGORY_CLASS = {
    combo:    'cat-combo',
    burgers:  'cat-burgers',
    fries:    'cat-fries',
    snacks:   'cat-snacks',
    drinks:   'cat-drinks',
    desserts: 'cat-desserts'
  };

  var MENU = [];

  var LOCATIONS = {
    m1: { name:'Тверская, 12', eta:'15–20 мин', coords:[37.6058, 55.7658] },
    m2: { name:'Арбат, 4', eta:'20–25 мин', coords:[37.5912, 55.7522] },
    m3: { name:'Сокольники, 9', eta:'25–30 мин', coords:[37.6775, 55.7890] },
    m4: { name:'Кутузовский, 24', eta:'18–23 мин', coords:[37.5292, 55.7391] }
  };
  var MY_COORDS = [37.5913, 55.7648]; // Малая Бронная, 7 (примерно)

  var FREE_DELIVERY_FROM = 999;
  var BASE_DELIVERY_FEE = 199;

  /* ---------------- State ---------------- */
  var state = {
    activeCategory: 'combo',
    activeTab: 'menu',
    selectedRestaurant: 'm1',
    cart: {},          // id -> qty
    favorites: {},      // id -> true
    activeOrder: null,  // текущий заказ в процессе доставки

    orders: []
  };

  /* ---------------- Utilities ---------------- */
  function money(n){ return n.toLocaleString('ru-RU') + ' \u20BD'; }
  function menuById(id){ for (var i=0;i<MENU.length;i++){ if (MENU[i].id===id) return MENU[i]; } return null; }
  function cartCount(){
    var c = 0;
    for (var id in state.cart){ c += state.cart[id]; }
    return c;
  }
  function cartSubtotal(){
    var sum = 0;
    for (var id in state.cart){
      var item = menuById(id);
      if (item) sum += item.price * state.cart[id];
    }
    return sum;
  }

  /* ---------------- Glass press effect ---------------- */
  function attachPress(el, opts){
    opts = opts || {};
    el.addEventListener('pointerdown', function(ev){
      el.classList.add('pressed');
      if (!opts.noSweep) spawnSweep(el, ev);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(function(evt){
      el.addEventListener(evt, function(){ el.classList.remove('pressed'); });
    });
  }

  function spawnSweep(el, ev){
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var rect = el.getBoundingClientRect();
    if (rect.width < 4) return;
    var startX = ev && ev.clientX ? (ev.clientX - rect.left) : rect.width * 0.2;
    var sweep = document.createElement('span');
    sweep.className = 'glass-sweep';
    var size = Math.max(rect.height, 18);
    sweep.style.width = size + 'px';
    sweep.style.height = size + 'px';
    sweep.style.marginTop = (-size/2) + 'px';
    sweep.style.marginLeft = (-size/2) + 'px';
    sweep.style.left = startX + 'px';
    el.appendChild(sweep);
    var endX = rect.width - startX;
    var anim = sweep.animate([
      { transform: 'translateX(0) scale(0.5)', opacity: 0 },
      { transform: 'translateX(' + (endX*0.35) + 'px) scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'translateX(' + endX + 'px) scale(0.7)', opacity: 0 }
    ], { duration: 460, easing: 'cubic-bezier(.22,.61,.36,1)' });
    anim.onfinish = function(){ sweep.remove(); };
  }

  /* ---------------- Toast ---------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function showToast(text, duration){
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, duration || 2200);
  }

  /* ---------------- Rendering: product grid ---------------- */
  var productGrid = document.getElementById('productGrid');

  function renderGrid(){
    var items = MENU.filter(function(m){ return m.cat === state.activeCategory; });
    var catClass = CATEGORY_CLASS[state.activeCategory];
    productGrid.innerHTML = '';
    items.forEach(function(item){
      var qty = state.cart[item.id] || 0;
      var isFav = !!state.favorites[item.id];

      var card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.id = item.id;

      var badgeHtml = item.badge ? '<span class="badge-tag">' + item.badge + '</span>' : '';

      card.innerHTML =
        '<div class="card-media ' + catClass + '">' +
          badgeHtml +
          '<button class="fav-btn' + (isFav ? ' is-fav' : '') + '" data-fav="' + item.id + '" type="button" aria-label="В избранное">' + (isFav ? HEART_FILLED : HEART_OUTLINE) + '</button>' +
          dishMedia(item) +
        '</div>' +
        '<div class="card-name">' + escapeHtml(item.name) + '</div>' +
        '<div class="card-desc">' + escapeHtml(item.desc) + '</div>' +
        '<div class="card-footer">' +
          '<span class="card-price">' + money(item.price) + '</span>' +
          '<div class="card-action" data-action-for="' + item.id + '"></div>' +
        '</div>';

      card.tabIndex = 0;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', item.name);
      card.addEventListener('click', function(e){ if (!e.target.closest('button')) openDish(item.id); });
      card.addEventListener('keydown', function(e){ if (e.target === card && e.key === 'Enter') openDish(item.id); });
      productGrid.appendChild(card);
      renderCardAction(item.id, qty);

      var favBtn = card.querySelector('[data-fav]');
      attachPress(favBtn);
      favBtn.addEventListener('click', function(ev){
        ev.stopPropagation();
        var id = this.getAttribute('data-fav');
        toggleFavorite(id);
      });
    });
  }

  function renderCardAction(id, qty){
    var slot = productGrid.querySelector('[data-action-for="' + id + '"]');
    if (!slot) return;
    slot.innerHTML = '';
    if (qty <= 0){
      var btn = document.createElement('button');
      btn.className = 'add-btn';
      btn.type = 'button';
      btn.textContent = 'Добавить';
      attachPress(btn);
      btn.addEventListener('click', function(){
        changeQty(id, 1);
        var card = slot.closest('.product-card');
        card.classList.remove('just-added');
        void card.offsetWidth;
        card.classList.add('just-added');
      });
      slot.appendChild(btn);
    } else {
      var wrap = document.createElement('div');
      wrap.className = 'stepper';
      var minus = document.createElement('button');
      minus.type = 'button'; minus.textContent = '−';
      var val = document.createElement('span');
      val.className = 'qty-val'; val.textContent = qty;
      var plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+';
      attachPress(minus); attachPress(plus);
      minus.addEventListener('click', function(){ changeQty(id, -1); });
      plus.addEventListener('click', function(){ changeQty(id, 1); });
      wrap.appendChild(minus); wrap.appendChild(val); wrap.appendChild(plus);
      slot.appendChild(wrap);
    }
  }

  function changeQty(id, delta){
    if (submitting) return;
    var current = state.cart[id] || 0;
    var next = Math.min(99, Math.max(0, current + delta));
    if (next === 0){ delete state.cart[id]; } else { state.cart[id] = next; }
    renderCardAction(id, next);
    syncCartUI();
  }

  function toggleFavorite(id){
    if (state.favorites[id]) { delete state.favorites[id]; } else { state.favorites[id] = true; }
    renderGrid();
    renderFavorites();
  }

  /* ---------------- Category chips ---------------- */
  var chipsRow = document.getElementById('categoryChips');
  Array.prototype.forEach.call(chipsRow.querySelectorAll('.category-chip'), function(chip){
    attachPress(chip);
    chip.addEventListener('click', function(){
      Array.prototype.forEach.call(chipsRow.querySelectorAll('.category-chip'), function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      state.activeCategory = chip.dataset.cat;
      renderGrid();
    });
  });

  (function makeDragScroll(el){
    var isDown = false;
    var didDrag = false;
    var startX = 0;
    var startScroll = 0;
    el.addEventListener('pointerdown', function(ev){
      isDown = true;
      didDrag = false;
      startX = ev.clientX;
      startScroll = el.scrollLeft;
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', function(ev){
      if (!isDown) return;
      var dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) didDrag = true;
      el.scrollLeft = startScroll - dx;
    });
    function endDrag(){
      isDown = false;
      el.classList.remove('dragging');
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointerleave', endDrag);
    el.addEventListener('pointercancel', endDrag);
    // Гасим случайный клик по чипу сразу после перетаскивания
    el.addEventListener('click', function(ev){
      if (didDrag){ ev.stopPropagation(); ev.preventDefault(); didDrag = false; }
    }, true);
  })(chipsRow);

  /* ---------------- Delivery / cart screen ---------------- */
  var cartListEl = document.getElementById('cartList');
  var checkoutBtn = document.getElementById('checkoutBtn');

  function currentDeliveryFee(){
    if (typeof currentMode !== 'undefined' && currentMode === 'dine-in') return 0;
    var subtotal = cartSubtotal();
    return subtotal >= FREE_DELIVERY_FROM ? 0 : BASE_DELIVERY_FEE;
  }

  function renderCartScreen(){
    var ids = Object.keys(state.cart);
    cartListEl.innerHTML = '';
    if (ids.length === 0){
      var empty = document.createElement('div');
      empty.className = 'empty-cart';
      empty.textContent = 'Корзина пуста — добавьте что-нибудь горячее из меню.';
      cartListEl.appendChild(empty);
    } else {
      ids.forEach(function(id){
        var item = menuById(id);
        if (!item) return;
        var qty = state.cart[id];
        var catClass = CATEGORY_CLASS[item.cat];
        var row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML =
          '<div class="card-media ' + catClass + '">' + dishMedia(item) + '</div>' +
          '<div class="cart-item-info">' +
            '<div class="card-name">' + escapeHtml(item.name) + '</div>' +
            '<div class="card-price">' + money(item.price) + '</div>' +
          '</div>' +
          '<div class="card-action" data-cart-action-for="' + id + '"></div>';
        cartListEl.appendChild(row);
        var slot = row.querySelector('[data-cart-action-for]');
        var wrap = document.createElement('div');
        wrap.className = 'stepper';
        var minus = document.createElement('button'); minus.type='button'; minus.textContent='−';
        var val = document.createElement('span'); val.className='qty-val'; val.textContent = qty;
        var plus = document.createElement('button'); plus.type='button'; plus.textContent='+';
        attachPress(minus); attachPress(plus);
        minus.addEventListener('click', function(){ changeQty(id, -1); renderCartScreen(); renderGrid(); });
        plus.addEventListener('click', function(){ changeQty(id, 1); renderCartScreen(); renderGrid(); });
        wrap.appendChild(minus); wrap.appendChild(val); wrap.appendChild(plus);
        slot.appendChild(wrap); // при «−» на количестве 1 товар убирается из корзины
      });
    }

    var subtotal = cartSubtotal();
    var fee = currentDeliveryFee();
    document.getElementById('sumSubtotal').textContent = money(subtotal);
    document.getElementById('sumDelivery').textContent = fee === 0 ? 'Бесплатно' : money(fee);
    document.getElementById('sumTotal').textContent = money(subtotal + fee);
    document.getElementById('deliveryFeeLabel').textContent = fee === 0 ? 'Бесплатно' : money(fee);
    checkoutBtn.disabled = subtotal === 0 || submitting;
    checkoutBtn.textContent = subtotal === 0 ? 'Оформить заказ' : 'Оформить заказ · ' + money(subtotal + fee);
  }

  function syncCartUI(){
    saveCart();
    var count = cartCount();
    var badge = document.getElementById('cartBadge');
    if (count > 0){ badge.hidden = false; badge.textContent = count > 99 ? '99+' : String(count); }
    else { badge.hidden = true; }
    renderCartScreen();
  }

  attachPress(checkoutBtn);
  checkoutBtn.addEventListener('click', submitOrder);

  /* ---------------- Profile screen ---------------- */
  var orderHistoryEl = document.getElementById('orderHistory');
  var favoritesListEl = document.getElementById('favoritesList');

  function renderOrders(){
    orderHistoryEl.innerHTML = '';
    state.orders.slice(0, 6).forEach(function(order){
      var li = document.createElement('li');
      li.innerHTML =
        '<div class="order-main">' +
          '<span class="order-items">' + escapeHtml(order.items) + '</span>' +
          '<span class="order-date">' + order.date + '</span>' +
        '</div>' +
        '<span class="order-total">' + money(order.total) + '</span>';
      orderHistoryEl.appendChild(li);
    });
  }

  /* ---------------- Active order tracking ---------------- */

  var orderStatusTimer = null;

  function addOrdersTab(){
    if (document.querySelector('.nav-btn[data-tab="orders"]')) return;
    var btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.type = 'button';
    btn.dataset.tab = 'orders';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>' +
      '<span>Заказ</span>';
    attachPress(btn, { noSweep: true });
    btn.addEventListener('click', function(){ switchTab('orders'); });
    var profileBtn = document.querySelector('.nav-btn[data-tab="profile"]');
    bottomNav.insertBefore(btn, profileBtn);
    navBtns.push(btn);
    positionIndicator();
  }

  function removeOrdersTab(){
    var btn = document.querySelector('.nav-btn[data-tab="orders"]');
    if (!btn) return;
    btn.remove();
    navBtns = navBtns.filter(function(b){ return b !== btn; });
    positionIndicator();
  }

  function renderOrderDetails(){
    if (!state.activeOrder) return;
    document.getElementById('orderNumber').textContent = '№' + state.activeOrder.number;
    document.getElementById('orderAddress').textContent = state.activeOrder.address;
    document.getElementById('orderTotal').textContent = money(state.activeOrder.total);
  }

  function startOrderStatusTimer(){
    if (orderStatusTimer) clearInterval(orderStatusTimer);
    updateOrderStatus();
    orderStatusTimer = setInterval(updateOrderStatus, 15000);
  }

  async function updateOrderStatus(){
    if (!state.activeOrder || polling) return;
    polling = true;
    try {
      var order = await api('/orders/' + state.activeOrder.number);
      var labels = {new:'Заказ получен', accepted:'Заказ принят', cooking:'Готовим ваш заказ', ready:'Заказ готов', completed:'Заказ завершён', cancelled:'Заказ отменён'};
      document.getElementById('orderStatusText').textContent = labels[order.status];
      document.getElementById('orderStatusIcon').innerHTML = ORDER_STAGE_ICONS[['ready','completed'].includes(order.status) ? 'delivered' : 'preparing'];
      document.getElementById('orderProgressFill').style.width = ({new:5,accepted:20,cooking:45,ready:80,completed:100,cancelled:0})[order.status] + '%';
      if (['completed','cancelled'].includes(order.status)) {
        clearInterval(orderStatusTimer);
        await loadOrders();
      }
    } catch(e) { document.getElementById('orderStatusText').textContent = 'Не удалось обновить статус. ' + e.message; }
    finally { polling = false; }
  }

  function renderFavorites(){
    var ids = Object.keys(state.favorites);
    favoritesListEl.innerHTML = '';
    if (ids.length === 0){
      var li = document.createElement('li');
      li.className = 'favorites-empty';
      li.textContent = 'Пока нет избранных блюд — нажмите на сердечко в меню.';
      favoritesListEl.appendChild(li);
      return;
    }
    ids.forEach(function(id){
      var item = menuById(id);
      if (!item) return;
      var li = document.createElement('li');
      li.innerHTML = HEART_FILLED + '<span>' + escapeHtml(item.name) + '</span>';
      favoritesListEl.appendChild(li);
    });
  }

  var pushSwitch = document.getElementById('pushSwitch');

  function setSwitch(el, on){
    el.classList.toggle('active', on);
    el.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  var themeSwitch = document.getElementById('themeSwitch');

  (function initThemeSwitch(){
    var saved = null;
    try { saved = localStorage.getItem('zh_theme'); } catch(e){}
    // По умолчанию тёмная тема; выбор пользователя (светлая/тёмная) запоминается.
    var theme = saved === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    setSwitch(themeSwitch, theme === 'dark');
  })();

  attachPress(themeSwitch);
  themeSwitch.addEventListener('click', function(){
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setSwitch(themeSwitch, next === 'dark');
    try { localStorage.setItem('zh_theme', next); } catch(e){}
  });

  attachPress(pushSwitch);
  setSwitch(pushSwitch, false);
  pushSwitch.disabled = true;
  pushSwitch.title = 'Уведомления пока не подключены';
  pushSwitch.addEventListener('click', function(){
    var isOn = pushSwitch.classList.contains('active');
    setSwitch(pushSwitch, !isOn);
    showToast(isOn ? 'Уведомления выключены' : 'Уведомления включены', 1600);
  });

  var paymentRow = document.getElementById('paymentRow');
  paymentRow.addEventListener('click', function(){ showToast('Оплата при получении. Онлайн-оплата пока не подключена.', 2200); });
  var supportRow = document.getElementById('supportRow');
  supportRow.addEventListener('click', function(){ showToast('Контакт ресторана пока не настроен', 1800); });

  document.getElementById('profileShortcut').addEventListener('pointerdown', function(ev){
    this.classList.add('pressed'); spawnSweep(this, ev);
  });
  ['pointerup','pointerleave'].forEach(function(evt){
    document.getElementById('profileShortcut').addEventListener(evt, function(){ this.classList.remove('pressed'); });
  });
  document.getElementById('profileShortcut').addEventListener('click', function(){ switchTab('profile'); });

  /* ---------------- Tabs / screens ---------------- */
  var screens = { menu: document.getElementById('screen-menu'), delivery: document.getElementById('screen-delivery'), profile: document.getElementById('screen-profile'), orders: document.getElementById('screen-orders') };
  var navBtns = Array.prototype.slice.call(document.querySelectorAll('.nav-btn'));
  var navIndicator = document.getElementById('navIndicator');
  var bottomNav = document.getElementById('bottomNav');
  var mapCardEl = document.getElementById('mapCard');

  navBtns.forEach(function(btn){
    attachPress(btn, { noSweep: true });
    btn.addEventListener('click', function(){ switchTab(btn.dataset.tab); });
  });

  function switchTab(tab){
    if (state.activeTab === tab) { return; }
    state.activeTab = tab;
    Object.keys(screens).forEach(function(key){
      var el = screens[key];
      if (key === tab){
        el.style.display = 'block';
        el.scrollTop = 0;
        requestAnimationFrame(function(){ el.classList.add('active'); });
      } else {
        el.classList.remove('active');
        setTimeout(function(){ if (state.activeTab !== key) el.style.display = 'none'; }, 280);
      }
    });
    navBtns.forEach(function(btn){ btn.classList.toggle('active', btn.dataset.tab === tab); });
    positionIndicator();
    updateMapPlacement();
    if (tab === 'delivery') renderCartModeSections();
    if (tab === 'profile') { renderOrders(); renderFavorites(); }
    if (tab === 'orders') { renderOrderDetails(); updateOrderStatus(); }
  }

  function positionIndicator(){
    var activeBtn = navBtns.filter(function(b){ return b.dataset.tab === state.activeTab; })[0];
    if (!activeBtn) return;
    var navRect = bottomNav.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();
    navIndicator.style.left = (btnRect.left - navRect.left) + 'px';
    navIndicator.style.width = btnRect.width + 'px';
  }
  window.addEventListener('resize', positionIndicator);

  /* ---------------- Mode toggle (В ресторане / Доставка) ---------------- */
  var modeToggle = document.getElementById('modeToggle');
  var modeIndicator = document.getElementById('modeIndicator');
  var modeBtns = Array.prototype.slice.call(modeToggle.querySelectorAll('.mode-btn'));
  var currentMode = 'delivery';
  var deliveryModeInfoEl = document.getElementById('deliveryModeInfo');
  var dineInCardEl = document.getElementById('dineInCard');
  var dineInMapSlotEl = document.getElementById('dineInMapSlot');
  var restaurantAddressTextEl = document.getElementById('restaurantAddressText');
  var categoryChipsEl = document.getElementById('categoryChips');

  function positionModeIndicator(){
    var activeBtn = modeBtns.filter(function(b){ return b.dataset.mode === currentMode; })[0];
    if (!activeBtn) return;
    var wrapRect = modeToggle.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();
    modeIndicator.style.left = (btnRect.left - wrapRect.left) + 'px';
    modeIndicator.style.width = btnRect.width + 'px';
  }

  function updateMapPlacement(){
    if (currentMode !== 'dine-in'){
      mapCardEl.classList.add('is-hidden');
      return;
    }
    mapCardEl.classList.remove('is-hidden');
    if (state.activeTab === 'delivery'){
      dineInMapSlotEl.appendChild(mapCardEl);
    } else {
      screens.menu.insertBefore(mapCardEl, categoryChipsEl);
    }
    nudgeYandexResizeIfNeeded();
  }

  function renderCartModeSections(){
    var isDineIn = (currentMode === 'dine-in');
    deliveryModeInfoEl.style.display = isDineIn ? 'none' : '';
    dineInCardEl.style.display = isDineIn ? '' : 'none';
    if (isDineIn && restaurantAddressTextEl){
      restaurantAddressTextEl.textContent = LOCATIONS[state.selectedRestaurant].name;
    }
    if (state.activeTab === 'delivery') renderCartScreen();
  }

  function setMode(mode){
    currentMode = mode;
    modeBtns.forEach(function(b){ b.classList.toggle('active', b.dataset.mode === mode); });
    positionModeIndicator();
    updateMapPlacement();
    renderCartModeSections();
  }

  function nudgeYandexResizeIfNeeded(){
    if (typeof yandexReady !== 'undefined' && yandexReady){
      setTimeout(function(){ try { window.dispatchEvent(new Event('resize')); } catch(e){} }, 340);
    }
  }

  modeBtns.forEach(function(btn){
    attachPress(btn, { noSweep: true });
    btn.addEventListener('click', function(){ setMode(btn.dataset.mode); });
  });
  window.addEventListener('resize', positionModeIndicator);
  setTimeout(positionModeIndicator, 60);

  /* ---------------- Map ---------------- */
  var markers = Array.prototype.slice.call(document.querySelectorAll('.marker'));
  var addressWrap = document.querySelector('.address-wrap');
  var addressChip = document.getElementById('addressChip');
  var addressDropdown = document.getElementById('addressDropdown');
  var addressInput = document.getElementById('addressInput');
  var addressSaveBtn = document.getElementById('addressSaveBtn');
  var addressLabel = document.getElementById('addressLabel');
  var deliveryAddressInput = document.getElementById('deliveryAddressInput');
  var deliveryTime = document.getElementById('deliveryTime');
  var profileAddress = document.getElementById('profileAddress');
  var myLocationMarker = document.getElementById('myLocationMarker');
  var MY_ADDRESS = 'Укажите адрес вручную';
  var DEFAULT_ADDRESS = '';

  var locationOrder = ['m1'];

  function applyAddress(value){
    state.deliveryAddress = value;
    addressLabel.textContent = value || 'Укажите адрес';
    if (deliveryAddressInput.value !== value) deliveryAddressInput.value = value;
    profileAddress.textContent = value;
  }

  function saveAddress(){
    var val = addressInput.value.trim();
    if (!val){ addressInput.focus(); return; }
    applyAddress(val);
    try { localStorage.setItem('zh_address', val); } catch(e){}
    closeAddressDropdown();
    showToast('Адрес сохранён', 1500);
  }

  attachPress(addressSaveBtn);
  addressSaveBtn.addEventListener('click', function(ev){ ev.stopPropagation(); saveAddress(); });
  addressInput.addEventListener('keydown', function(ev){
    ev.stopPropagation();
    if (ev.key === 'Enter'){ ev.preventDefault(); saveAddress(); }
  });
  addressInput.addEventListener('click', function(ev){ ev.stopPropagation(); });

  function saveDeliveryAddressFromCart(){
    var val = deliveryAddressInput.value.trim();
    if (!val) return;
    applyAddress(val);
    try { localStorage.setItem('zh_address', val); } catch(e){}
  }
  deliveryAddressInput.addEventListener('blur', saveDeliveryAddressFromCart);
  deliveryAddressInput.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter'){ ev.preventDefault(); deliveryAddressInput.blur(); }
  });

  function openAddressDropdown(){
    addressInput.value = state.deliveryAddress || '';
    addressDropdown.classList.add('open');
    addressChip.classList.add('open');
    addressChip.setAttribute('aria-expanded', 'true');
    setTimeout(function(){ addressInput.focus(); addressInput.select(); }, 180);
  }
  function closeAddressDropdown(){
    addressDropdown.classList.remove('open');
    addressChip.classList.remove('open');
    addressChip.setAttribute('aria-expanded', 'false');
  }
  function toggleAddressDropdown(){
    if (addressDropdown.classList.contains('open')) closeAddressDropdown();
    else openAddressDropdown();
  }

  attachPress(addressChip);
  addressChip.addEventListener('click', function(ev){
    ev.stopPropagation();
    toggleAddressDropdown();
  });
  document.addEventListener('click', function(ev){
    if (!addressWrap.contains(ev.target)) closeAddressDropdown();
  });
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape'){ closeAddressDropdown(); closeMapFullscreen(); }
  });

  var yandexReady = false;
  var yandexMap = null;
  var yandexPinEls = {};
  var mapSurface = document.getElementById('mapSurface');
  // Чтобы подключить настоящие Яндекс.Карты: получите бесплатный ключ на
  // https://developer.tech.yandex.ru/ (JavaScript API) и впишите его сюда.
  // Ниже НЕТ настоящего ключа — вставьте свой собственный.
  // Внутри опубликованной ссылки claude.ai скрипт с домена Яндекса всё равно
  // заблокирован песочницей (разрешены только cdnjs/jsdelivr/tailwind/jquery) —
  // карта заработает по-настоящему только при размещении файла на вашем
  // собственном хостинге с вашим ключом.
  var YANDEX_API_KEY = 'YOUR_YANDEX_API_KEY';

  function loadYandexMaps(){
    try {
      var script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/v3/?apikey=' + encodeURIComponent(YANDEX_API_KEY) + '&lang=ru_RU';
      script.async = true;
      script.onload = initYandexMap;
      script.onerror = function(){ /* остаёмся на схеме-локаторе */ };
      document.head.appendChild(script);
    } catch(e){ /* остаёмся на схеме-локаторе */ }
  }

  function initYandexMap(){
    if (!window.ymaps3) return;
    ymaps3.ready.then(function(){
      var YMap = ymaps3.YMap;
      var YMapDefaultSchemeLayer = ymaps3.YMapDefaultSchemeLayer;
      var YMapDefaultFeaturesLayer = ymaps3.YMapDefaultFeaturesLayer;
      var YMapMarker = ymaps3.YMapMarker;

      var container = document.createElement('div');
      container.id = 'yandexMapEl';
      container.style.width = '100%';
      container.style.height = '100%';
      mapSurface.innerHTML = '';
      mapSurface.appendChild(container);

      yandexMap = new YMap(container, {
        location: { center: LOCATIONS['m1'].coords, zoom: 12 }
      });
      yandexMap.addChild(new YMapDefaultSchemeLayer());
      yandexMap.addChild(new YMapDefaultFeaturesLayer());

      locationOrder.forEach(function(id){
        var loc = LOCATIONS[id];
        var pinEl = document.createElement('div');
        pinEl.className = 'yandex-pin' + (id === 'm1' ? ' active' : '');
        pinEl.addEventListener('click', function(ev){ ev.stopPropagation(); highlightRestaurant(id); });
        yandexPinEls[id] = pinEl;
        yandexMap.addChild(new YMapMarker({ coordinates: loc.coords }, pinEl));
      });

      var meEl = document.createElement('div');
      meEl.className = 'yandex-pin yandex-pin-me';
      meEl.addEventListener('click', function(ev){ ev.stopPropagation(); showMyLocation(); });
      yandexMap.addChild(new YMapMarker({ coordinates: MY_COORDS }, meEl));

      yandexReady = true;
    }).catch(function(){ /* остаёмся на схеме-локаторе */ });
  }
  // Карта не загружается без настроенного ключа.

  function refreshYandexPins(activeId){
    Object.keys(yandexPinEls).forEach(function(id){
      yandexPinEls[id].classList.toggle('active', id === activeId);
    });
  }

  function nudgeYandexResize(){
    if (!yandexReady) return;
    setTimeout(function(){
      try { window.dispatchEvent(new Event('resize')); } catch(e){}
    }, 60);
  }

  function openMapFullscreen(){
    while (mapSurface.firstChild){ mapFullscreenSurface.appendChild(mapSurface.firstChild); }
    mapFullscreen.classList.add('open');
    nudgeYandexResize();
  }
  function closeMapFullscreen(){
    if (!mapFullscreen.classList.contains('open')) return;
    mapFullscreen.classList.remove('open');
    while (mapFullscreenSurface.firstChild){ mapSurface.appendChild(mapFullscreenSurface.firstChild); }
    nudgeYandexResize();
  }

  var mapFullscreen = document.getElementById('mapFullscreen');
  var mapFullscreenSurface = document.getElementById('mapFullscreenSurface');
  var mapFullscreenClose = document.getElementById('mapFullscreenClose');
  attachPress(mapFullscreenClose);
  mapFullscreenClose.addEventListener('click', closeMapFullscreen);
  mapCardEl.addEventListener('click', openMapFullscreen);

  // Карта показывает рестораны; при клике по маркеру запоминаем выбор —
  // в режиме «В ресторане» этот ресторан используется как адрес заказа.
  function highlightRestaurant(id){
    state.selectedRestaurant = id;
    markers.forEach(function(m){ m.classList.toggle('active', m.dataset.id === id); });
    refreshYandexPins(id);
    var loc = LOCATIONS[id];
    if (restaurantAddressTextEl) restaurantAddressTextEl.textContent = loc.name;
    showToast(loc.name + ' · ' + loc.eta, 1800);
  }

  markers.forEach(function(m){
    m.addEventListener('click', function(ev){ ev.stopPropagation(); highlightRestaurant(m.dataset.id); });
    m.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); ev.stopPropagation(); highlightRestaurant(m.dataset.id); }
    });
  });

  function showMyLocation(){
    showToast('Ваш адрес: ' + MY_ADDRESS, 2000);
  }
  myLocationMarker.addEventListener('click', function(ev){ ev.stopPropagation(); showMyLocation(); });
  myLocationMarker.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); ev.stopPropagation(); showMyLocation(); }
  });

  /* ---------------- Init ---------------- */
  renderGrid();
  renderFavorites();
  renderOrders();
  initialize();
  (function initAddress(){
    var saved = null;
    try { saved = localStorage.getItem('zh_address'); } catch(e){}
    applyAddress(saved || DEFAULT_ADDRESS);
  })();
  updateMapPlacement();
  renderCartModeSections();
  setTimeout(positionIndicator, 60);

})();
