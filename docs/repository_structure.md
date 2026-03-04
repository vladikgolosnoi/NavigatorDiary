# Структура репозитория

Документ нужен для быстрой ориентации перед выкладкой проекта в общий доступ.

## Корень

- `apps/` — прикладные сервисы (клиент и сервер).
- `packages/` — переиспользуемые пакеты.
- `docs/` — проектная документация.
- `.github/` — шаблоны GitHub (Issue/PR).
- `.editorconfig`, `.gitattributes` — единые правила форматирования и атрибутов Git.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` — правила участия в проекте.
- `LICENSE` — лицензия проекта.
- `docker-compose.yml` — локальный запуск БД и API в контейнерах.
- `TASKS.md` — история пошагового выполнения проекта.
- `README.md` — основной входной документ для разработчиков и заказчика.

## Клиент (`apps/web`)

- `src/App.tsx` — роутинг и подключение экранов.
- `src/screens/` — экраны приложения по ТЗ.
- `src/components/` — UI-компоненты.
- `src/state/` — состояние авторизации и навигации.
- `src/api/` — HTTP-клиент и работа с API.
- `src/assets/` — логотипы, значки, иллюстрации.
- `public/resources/` — материалы из приложений к ТЗ.
- `vite.config.ts` — конфигурация Vite и PWA.

## Сервер (`apps/server`)

- `src/main.ts` — точка входа NestJS.
- `src/auth/` — аутентификация и роли.
- `src/goals/`, `src/specialties/`, `src/achievements/` — ключевая логика ТЗ.
- `src/chat/`, `src/beaver-hut/`, `src/announcements/` — командные и контентные модули.
- `src/appeals/` — обращения онлайн-консультанта.
- `src/users/`, `src/teams/` — профиль и команды.
- `prisma/schema.prisma` — схема БД.
- `prisma/migrations/` — миграции.
- `prisma/seed.ts` + `prisma/seed-data/` — сидирование данных приложений.

## Общий пакет (`packages/shared`)

- `src/index.ts` — общие типы/контракты между клиентом и сервером.

## Документация (`docs`)

- `architecture.md` — архитектурная схема.
- `domain_model.md` — доменные сущности.
- `rbac.md` — роли и доступы.
- `business_rules.md` — формализованные правила.
- `navigation_map.md` — карта экранов и меню.
- `assumptions.md` — допущения проекта.
- `tz_compliance_report.md` — сверка с ТЗ и приложениями.
- `user_guide_testing.md` — инструкция для проверки и демонстрации.
- `tasks_overview.md` — навигация по выполненным шагам.
- `specs/` — все исходные материалы ТЗ в одном месте.

## Что считается лишним и не хранится в Git

- `node_modules/`
- `dist/`, `build/`, `.vite/`, `coverage/`
- `*.tsbuildinfo`
- локальные `.env`
- системные файлы (`.DS_Store` и т.п.)

Полный список игнора: `.gitignore`.
