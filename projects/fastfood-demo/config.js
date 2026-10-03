// Публичная настройка. Здесь нельзя хранить токен бота или ключ администратора.
// Демо-версия: запросы перехватывает mock-api.js. Для file:// (открытие двойным кликом)
// адрес оставляем пустым, иначе получался неверный URL «file://config».
window.APP_CONFIG = {
  API_URL: location.protocol === 'file:' ? ''
    : ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5500'
    ? 'http://127.0.0.1:8000'
    : location.origin
};
