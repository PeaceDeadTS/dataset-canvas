# Dataset Canvas

**Dataset Canvas** — это веб-приложение, созданное как полнофункциональный клон Hugging Face Data Studio, предназначенное для управления, визуализации и работы с датасетами изображений. Приложение поддерживает аутентификацию пользователей, ролевую систему доступа и предоставляет мощные инструменты для работы с данными.

## ✨ Ключевые особенности

### 🔐 Система аутентификации и ролей
- **Безопасная регистрация и авторизация** через JWT токены
- **Трехуровневая система ролей**:
  - **Администратор**: полный доступ ко всем датасетам и пользователям
  - **Разработчик**: может создавать датасеты и управлять своими
  - **Пользователь**: доступ только к публичным датасетам
- Первый зарегистрированный пользователь автоматически получает права администратора

### 📊 Управление датасетами
- **CRUD операции** для датасетов с полным контролем доступа
- **Приватные и публичные датасеты** с гибкой системой видимости
- **CSV загрузка данных** с поддержкой метаданных изображений
- **Валидация и обработка** загружаемых данных
- **Каскадное удаление** связанных данных для поддержания целостности

### 🖼️ Продвинутая визуализация данных
- **Умная организация колонок**: Row → Image Key → Filename → Image → Dimensions → Prompt
- **Интерактивные превью изображений** с модальными окнами
- **Интеллектуальный расчет пропорций** с упрощением дробей и определением стандартных соотношений (16:9, 4:3, и др.)
- **Автоматическое определение расширений файлов** из URL
- **Адаптивные модальные окна** с корректным масштабированием

### 🎛️ Продвинутая пагинация и навигация
- **URL-интегрированная пагинация** с поддержкой прямых ссылок (`?p=22`)
- **Настраиваемые размеры страниц**: 10/25/50/100 элементов
- **Умная группировка страниц** с многоточиями для больших наборов
- **Breadcrumb навигация** для удобного перемещения
- **Фиксированная структура интерфейса**: заголовок и пагинация всегда видны, прокручивается только таблица данных

### 🎨 Современный пользовательский интерфейс
- **Responsive дизайн** с поддержкой всех устройств
- **Темизированный интерфейс** на основе Tailwind CSS и shadcn/ui
- **Аккордеон для Dataset Card** с возможностью скрытия дополнительной информации
- **Оптимизированное использование экранного пространства** (до 98vw)
- **Интуитивные элементы управления** и индикаторы состояния

## 🛠️ Технологический стек

### Backend
- **Node.js** с **Express.js** — основа сервера
- **TypeScript** — статическая типизация
- **TypeORM** — ORM для работы с базой данных
- **MariaDB/MySQL** — реляционная база данных
- **JWT** — аутентификация и авторизация
- **bcrypt** — хеширование паролей
- **multer** + **csv-parser** — загрузка и обработка CSV файлов
- **Winston** — система логирования

### Frontend
- **React 18** с **TypeScript** — пользовательский интерфейс
- **Vite** — сборка и разработка
- **Tailwind CSS** — утилитарные стили
- **shadcn/ui** — библиотека доступных компонентов
- **React Router** — клиентская маршрутизация
- **Axios** — HTTP клиент

### Тестирование
- **Vitest** — современный test runner
- **Supertest** — интеграционные тесты API
- **React Testing Library** — тестирование компонентов
- **JSDOM** — симуляция браузерного окружения

## 🚀 Быстрый старт

### Требования
- [Node.js](https://nodejs.org/) v18+ (рекомендуется LTS)
- [MariaDB](https://mariadb.org/) или MySQL сервер
- [Git](https://git-scm.com/) для клонирования репозитория

### Установка

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/your-username/dataset-canvas.git
   cd dataset-canvas
   ```

2. **Настройте базу данных:**
   ```sql
   CREATE DATABASE dataset_canvas;
   CREATE USER 'dataset_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON dataset_canvas.* TO 'dataset_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Настройте backend:**
   ```bash
   cd backend
   npm install
   ```

   Создайте файл `.env` в директории `backend`:
   ```env
   # Настройки базы данных
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=dataset_user
   DB_PASSWORD=your_password
   DB_NAME=dataset_canvas
   
   # JWT секрет (используйте сложный пароль для production)
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters
   
   # Для production (Unix socket - переопределяет host/port)
   # DB_SOCKET_PATH=/var/run/mysqld/mysqld.sock
   ```

4. **Запустите миграции базы данных:**
   ```bash
   npm run migration:run
   ```

5. **Настройте frontend:**
   ```bash
   cd ..  # вернитесь в корневую директорию
   npm install
   ```

### Запуск приложения

Запустите backend и frontend в отдельных терминалах:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev  # или npm start для production сборки
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## 📋 Доступные команды

### Backend
```bash
npm run dev          # Запуск в режиме разработки с hot reload
npm run build        # Сборка TypeScript в JavaScript
npm start            # Запуск production сборки
npm test             # Запуск тестов
npm run migration:generate  # Генерация новой миграции
npm run migration:run       # Выполнение миграций
```

### Frontend
```bash
npm run dev          # Запуск сервера разработки
npm run build        # Сборка для production
npm run preview      # Предпросмотр production сборки
npm test             # Запуск тестов
npm run lint         # Проверка кода ESLint
```

## 🗄️ Структура проекта

```
dataset-canvas/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── entity/         # TypeORM сущности
│   │   ├── routes/         # API маршруты
│   │   ├── middleware/     # Express middleware
│   │   ├── test/          # Тесты backend
│   │   └── types/         # TypeScript типы
│   ├── .env               # Переменные окружения
│   └── package.json
├── src/                    # Frontend приложение
│   ├── components/        # React компоненты
│   │   └── ui/           # shadcn/ui компоненты
│   ├── pages/            # Страницы приложения
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Утилиты
│   └── types/            # Общие TypeScript типы
├── public/               # Статические файлы
└── PROJECT_CONSTITUTION.md  # Подробная документация архитектуры
```

## 🧪 Тестирование

### Запуск всех тестов
```bash
# Frontend тесты (из корня)
npm test

# Backend тесты (из backend/)
cd backend && npm test
```

### Особенности тестирования
- **Изолированная тестовая база данных** (`dataset_canvas_test_safe`)
- **Автоматическая настройка** тестового окружения
- **Интеграционные тесты API** с полным покрытием эндпоинтов
- **Компонентные тесты** с React Testing Library

## 🔧 Архитектура

### База данных
Приложение использует **миграционную систему** для безопасного управления схемой:
- **Контролируемые изменения** через TypeORM миграции
- **Версионирование схемы** и откат изменений
- **Каскадные связи** для поддержания целостности данных

### API эндпоинты
- `POST /api/auth/register` — регистрация пользователя
- `POST /api/auth/login` — авторизация
- `GET /api/datasets` — список датасетов с фильтрацией по видимости
- `POST /api/datasets` — создание нового датасета
- `GET /api/datasets/:id` — получение датасета с пагинацией изображений
- `PUT /api/datasets/:id` — обновление датасета
- `DELETE /api/datasets/:id` — удаление датасета
- `POST /api/datasets/:id/upload` — загрузка CSV с изображениями

### Система ролей и доступа
- **Middleware аутентификации**: `checkJwt` и `checkJwtOptional`
- **Гранулярные разрешения** на уровне API и UI
- **Автоматические проверки доступа** для приватных датасетов

## 🎯 Формат CSV для загрузки

Файл должен содержать следующие колонки:
```csv
filename,url,width,height,prompt
example1.jpg,https://example.com/img1.jpg,1024,768,"Beautiful landscape"
example2.png,https://example.com/img2.png,512,512,"Abstract art"
```

## 📚 Дополнительная документация

- **[PROJECT_CONSTITUTION.md](./PROJECT_CONSTITUTION.md)** — подробная архитектурная документация
- **[Cursor Rules](./cursor-rules/)** — стандарты кодирования для React, TypeScript и Tailwind CSS

## 🤝 Контрибуция

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

---

**Dataset Canvas** — современное решение для работы с датасетами изображений, сочетающее мощный функционал с интуитивным пользовательским интерфейсом.