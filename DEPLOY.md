# Деплой на Vercel и домен reg.ru

На Vercel нет постоянного диска, поэтому локальный SQLite не подойдёт. Используем **Turso** (облачный SQLite) — тот же драйвер, только `DATABASE_URL` будет указывать на Turso.

---

## 1. База данных Turso

1. Зарегистрируйся: [turso.tech](https://turso.tech).
2. Установи CLI (опционально):  
   `winget install tursodatabase.turso` или  
   `curl -sSfL https://get.turso.tech/install.sh | bash`
3. Вход: `turso auth login`
4. Создай БД и получи URL и токен:
   ```bash
   turso db create catalog --region ams
   turso db show catalog
   turso db tokens create catalog
   ```
   В выводе будет:
   - **URL** вида `libsql://catalog-xxx.turso.io`
   - **Auth Token** — длинная строка

Сохрани их — понадобятся для Vercel.

---

## 2. Деплой на Vercel

1. Залей проект в **GitHub** (или GitLab/Bitbucket).
2. Зайди на [vercel.com](https://vercel.com) → **Add New Project** → импортируй репозиторий.
3. **Root Directory**: если приложение в подпапке, укажи её (например `raven-website/catalog`), чтобы корнем сборки была папка с `package.json` и `next.config.mjs`.
4. **Framework Preset**: Next.js (подставится сам).
5. **Build Command**: `pnpm run build` (или `npm run build`).
6. **Install Command**: `pnpm install` (или `npm install`).

Не нажимай Deploy — сначала добавь переменные.

---

## 3. Переменные окружения в Vercel

В проекте: **Settings → Environment Variables**. Добавь (для Production, Preview при необходимости):

| Переменная | Значение | Комментарий |
|------------|----------|-------------|
| `PAYLOAD_SECRET` | Случайная длинная строка | Сгенерируй сам, не из .env.example |
| `DATABASE_URL` | `libsql://catalog-xxx.turso.io` | URL из Turso |
| `DATABASE_AUTH_TOKEN` | Токен из `turso db tokens create` | Только для Turso |
| `NEXT_PUBLIC_APP_URL` | `https://твой-домен.ru` | Будет основной URL приложения |
| `NEXT_PUBLIC_LANDING_URL` | `https://твой-домен.ru` или лендинг | Откуда ссылка «Назад на сайт» |
| `ORDER_EMAIL` | Email для заказов | Например info@твой-домен.ru |
| `RESEND_API_KEY` | Ключ из resend.com | Для писем |
| `RESEND_FROM_EMAIL` | С которого отправлять | Должен быть верифицирован в Resend |

После сохранения переменных нажми **Deploy** (или сделай новый деплой).

---

## 4. Домен reg.ru → Vercel

1. В **Vercel**: проект → **Settings → Domains** → **Add** → введи домен (например `catalog.твой-домен.ru` или `твой-домен.ru`).
2. Vercel покажет, что нужно прописать в DNS (CNAME или A-запись).
3. В **reg.ru**: панель управления доменом → **DNS-серверы / Поддержка DNS** → управление зоной (или «Домен» → «Управление зоной»).
4. Добавь запись так, как просит Vercel:
   - **Поддомен** (например `catalog` или `@` для корня):
     - Либо **CNAME** → `cname.vercel-dns.com`
     - Либо **A** → `76.76.21.21`
   - Для корня домена (`example.ru`) часто нужна A-запись `76.76.21.21`; для поддомена (`catalog.example.ru`) — CNAME на `cname.vercel-dns.com`.
5. Сохрани изменения в DNS и подожди 5–30 минут. В Vercel во вкладке Domains статус сменится на «Valid» (и появится сертификат).

---

## 5. Два проекта: лендинг на raven-custom.com и каталог

У тебя **два проекта на Vercel**: лендинг (главная) и этот каталог. Нужно:
- **raven-custom.com** → лендинг (корень)
- Каталог — либо **catalog.raven-custom.com**, либо **raven-custom.com/catalog**

### Вариант A: Каталог на поддомене (catalog.raven-custom.com)

Проще в настройке: каталог — отдельный домен.

1. **Лендинг (проект на Vercel)**  
   Домен: `raven-custom.com` (и при необходимости `www.raven-custom.com`). DNS: A/CNAME как просит Vercel.

2. **Каталог (этот проект)**  
   - В Vercel → **Settings → Domains** добавь `catalog.raven-custom.com`.  
   - В DNS создай запись: **CNAME** `catalog` → `cname.vercel-dns.com`.  
   - **Environment Variables** (Production):
     - `NEXT_PUBLIC_APP_URL` = `https://catalog.raven-custom.com`
     - `NEXT_PUBLIC_LANDING_URL` = `https://raven-custom.com`  
   Сохрани и сделай **Redeploy**.

3. На лендинге ссылка «В каталог» ведёт на `https://catalog.raven-custom.com`. Кнопка «Назад на сайт» в каталоге ведёт на `https://raven-custom.com`.

---

### Вариант B: Каталог по пути raven-custom.com/catalog

Один домен: лендинг на корне, каталог по пути `/catalog`.

1. **Лендинг (проект на Vercel)**  
   Домен: `raven-custom.com`. В **корне проекта лендинга** создай или дополни `vercel.json`:

   ```json
   {
     "rewrites": [
       { "source": "/catalog", "destination": "https://raven-catalog.vercel.app/catalog" },
       { "source": "/catalog/:path*", "destination": "https://raven-catalog.vercel.app/catalog/:path*" }
     ]
   }
   ```

   Подставь вместо `raven-catalog.vercel.app` URL деплоя каталога на Vercel, если он другой. Задеплой лендинг заново.

2. **Каталог (этот проект)**  
   - В Vercel **Environment Variables** (Production) задай:
     - `NEXT_PUBLIC_BASE_PATH` = `/catalog`
     - `NEXT_PUBLIC_APP_URL` = `https://raven-custom.com/catalog`
     - `NEXT_PUBLIC_LANDING_URL` = `https://raven-custom.com`  
   - Сохрани переменные и сделай **Redeploy** каталога.

3. После этого:
   - `https://raven-custom.com` — лендинг;
   - `https://raven-custom.com/catalog` — каталог, `https://raven-custom.com/catalog/admin` — админка.

На лендинге ссылка «В каталог» должна вести на `https://raven-custom.com/catalog`.

---

## 6. Подключение одного домена (если каталог = весь сайт)

Если каталог — единственное приложение на домене (без отдельного лендинга):

1. **Vercel → Settings → Domains** добавь домен (например `raven-custom.com`).
2. **DNS**: A или CNAME по подсказкам Vercel.
3. **Environment Variables**: `NEXT_PUBLIC_APP_URL` = `https://raven-custom.com`, `NEXT_PUBLIC_LANDING_URL` = `https://raven-custom.com`.
4. **Redeploy**.

---

## 7. Проверка

- Открой `https://твой-домен.ru` — должен открыться сайт.
- Админка: `https://твой-домен.ru/admin` — войди под своим пользователем (создай его локально и сделай миграции на Turso, либо создай первого админа через скрипт/локально с `DATABASE_URL` от Turso).

---

## Миграции и первый админ

- Схема на Turso создаётся при первом запуске (Payload поднимает миграции).
- Пользователей можно создать локально, указав в `.env` на время `DATABASE_URL` и `DATABASE_AUTH_TOKEN` от Turso, и запустив скрипт создания админа (если у тебя такой есть), либо через админку после первого входа, если есть возможность регистрации.

Если нужен отдельный шаг «как один раз прогнать миграции на Turso с машины» — можно добавить в этот файл отдельный подпункт.
