# Публичный деплой для заказчика (Render)

Цель: получить одну публичную ссылку, где работают и интерфейс, и API, и база данных.

Быстрый запуск в 1 клик:
[Deploy to Render](https://render.com/deploy?repo=https://github.com/vladikgolosnoi/NavigatorDiary)

## Что уже подготовлено в репозитории

- Добавлен `render.yaml` (Blueprint) в корень проекта.
- Сервер (`NestJS`) настроен отдавать фронтенд из `apps/web/dist` в production.
- Миграции и сиды запускаются автоматически при старте сервиса.

## Как развернуть

1. Открыть [Render Dashboard](https://dashboard.render.com/).
2. Нажать **New +** -> **Blueprint**.
3. Подключить GitHub-репозиторий `vladikgolosnoi/NavigatorDiary`.
4. Подтвердить создание сервисов из `render.yaml`.
5. Дождаться статуса **Live** у сервиса `navigator-diary`.

После этого появится публичный URL вида:
`https://navigator-diary.onrender.com`

## Данные для теста

- Организатор: `organizer@demo.local` / `Demo123!`
- Руководитель: `leader@demo.local` / `Demo123!`
- Навигатор: `navigator@demo.local` / `Demo123!`

## Что проверять

- Авторизация и роли.
- Каталог целей/специальностей.
- Мои цели/достижения/хатка бобра.
- Чат команды и реакции.
- Дашборды руководителя и организатора.
