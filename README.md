# Дневник навигатора

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-0A7EA4)

Fullstack-проект (PWA + API) для программы «Дружина навигаторов».  
Цель: цифровой «дневник роста» с ролями, достижениями, каталогами целей/специальностей и командным взаимодействием.

## Быстрые ссылки

- Описание и запуск: `README.md`
- Карта структуры репозитория: `docs/repository_structure.md`
- Индекс документации: `docs/README.md`
- Портфолио-обзор для HR: `docs/hr/portfolio_overview.md`
- План скриншотов для презентации: `docs/screenshots/README.md`
- Пошаговые задания реализации: `TASKS.md`
- Отчет соответствия ТЗ: `docs/tz_compliance_report.md`
- Пользовательская инструкция и тест-сценарии: `docs/user_guide_testing.md`
- Исходные файлы ТЗ и приложений: `docs/specs/README.md`

## Что реализовано

- Роли: **организатор**, **руководитель**, **навигатор** (RBAC на API и UI).
- Авторизация/регистрация команды и пользователя с подтверждениями по ролям.
- Каталог целей: возраст → сфера → компетентность → цель.
- Ограничения бизнес-логики:
  - не более 12 целей за выбор;
  - повторный выбор через 3 месяца;
  - отметка прогресса цели не чаще 1 раза в неделю;
  - одна активная специальность.
- Каталог специальностей + чек-листы и уровни подтверждения.
- Достижения: возрастной статус + этапы («старт» ... «успех»).
- «Хатка бобра»: жёлуди/веточки/поленья по правилам ТЗ.
- Чат команды (REST + WebSocket), реакции и автосообщения.
- Анонсы, обращения онлайн-консультанта, аудит ключевых действий.
- Полноценная мобильная адаптация и PWA-поведение.

## Технологический стек

- `apps/web`: React, Vite, TypeScript, React Router, vite-plugin-pwa
- `apps/server`: NestJS, Prisma, PostgreSQL, JWT, WebSocket
- Тесты: Vitest (web), Jest (server)
- Инфраструктура: Docker Compose

## Структура проекта

```text
.
├── apps/
│   ├── web/       # клиент (PWA)
│   └── server/    # API и бизнес-логика
├── packages/
│   └── shared/    # общие типы
├── docs/          # документация и материалы ТЗ
├── docker-compose.yml
└── TASKS.md       # пошаговая история реализации
```

Подробно: `docs/repository_structure.md`

## Требования

- Node.js 18+
- npm 9+
- Docker + Docker Compose

## Локальный запуск

### 1) Установка зависимостей

```bash
npm install
```

### 2) Поднять БД и API

```bash
docker compose -p navigator-diary up -d --build
docker compose -p navigator-diary exec -T server sh -lc 'npx prisma migrate deploy && npx prisma db seed'
```

API: `http://localhost:3000/api`

### 3) Запустить веб

```bash
npm run dev -w apps/web -- --host 0.0.0.0 --port 5173
```

Web: `http://localhost:5173`

## Демо-доступы

- Организатор: `organizer@demo.local` / `Demo123!`
- Руководитель: `leader@demo.local` / `Demo123!`
- Навигатор: `navigator@demo.local` / `Demo123!`

## Команды разработки

```bash
# Сборка
npm run build:web
npm run build:server

# Тесты
npm run test -w apps/web
npm run test -w apps/server

# Разработка без Docker
npm run dev:web
npm run dev:server
```

## Ключевая документация

- Архитектура: `docs/architecture.md`
- Доменная модель: `docs/domain_model.md`
- Роли и права: `docs/rbac.md`
- Бизнес-правила: `docs/business_rules.md`
- Карта навигации: `docs/navigation_map.md`
- Допущения: `docs/assumptions.md`
- Отчет соответствия ТЗ: `docs/tz_compliance_report.md`
- Инструкция тестирования: `docs/user_guide_testing.md`

## Материалы заказчика (ТЗ)

Все исходные файлы вынесены в один каталог: `docs/specs/`

- ТЗ (исходная и обновленная версии)
- Приложение 2 (цели)
- Приложение 3 (специальности)
- Файл значков

Состав и назначение файлов: `docs/specs/README.md`

## Скриншоты интерфейса

Для публичной презентации добавьте реальные скриншоты в `docs/screenshots/`:

- `01_auth.png`
- `02_home.png`
- `03_goals.png`
- `04_specialties.png`
- `05_achievements.png`
- `06_beaver_hut.png`
- `07_chat.png`
- `08_organizer_dashboard.png`

Инструкция по съемке и формату: `docs/screenshots/README.md`.

## Для публикации на GitHub

- В репозитории не хранятся локальные зависимости, артефакты сборки и `.env`.
- Шаблоны для командной работы:
  - `CONTRIBUTING.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
- Лицензия: `LICENSE`
- Технические метаданные: `.editorconfig`, `.gitattributes`, `CODE_OF_CONDUCT.md`
- Финальный чек-лист выкладки: `docs/hr/github_publish_checklist.md`
- Рекомендуемый сценарий первого публичного push (с чистой историей) — в `docs/hr/github_publish_checklist.md`.
