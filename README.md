# DuckDB Demo

## Установка
```bash
npm i
```

## Запуск
```bash
npm run dev
```

Сервер запускается на `0.0.0.0`, поэтому к нему можно подключаться из локальной сети по адресу `<IP-адрес>:3000`.

- Главная страница: `/` — статус подключения к БД
- Страница настроек: `/settings`

### Пример настроек
- Mock: `engine = mock`
- DuckDB: `engine = duckdb`, `duckdbPath = ./data/analytics.duckdb`
