# Quicket - Docker Setup

Система бронирования билетов на спортивные и культурные мероприятия с использованием Docker.

## Требования

- Docker >= 20.10
- Docker Compose >= 2.0
- make (опционально, для удобных команд)

## Быстрый запуск

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd quicket
   ```

2. **Создайте необходимые файлы**
   
   Создайте файл `.env` в корне проекта:
   ```env
   # Database
   POSTGRES_PASSWORD=your_strong_password_here
   
   # Backend
   SECRET_KEY=your_production_secret_key_change_this
   JWT_SECRET_KEY=your_production_jwt_secret_change_this
   
   # Frontend
   VITE_API_URL=http://localhost:5000
   ```

3. **Запустите проект**
   ```bash
   # С использованием make (рекомендуется)
   make dev
   
   # Или напрямую через docker-compose
   docker-compose up --build
   ```

4. **Откройте приложение**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432

## Управление проектом

### С использованием Makefile (рекомендуется)

```bash
# Показать все доступные команды
make help

# Сборка всех образов
make build

# Запуск всех сервисов
make up

# Остановка всех сервисов
make down

# Перезапуск сервисов
make restart

# Просмотр логов
make logs

# Очистка (остановка + удаление томов)
make clean

# Запуск с пересборкой
make dev
```

### Команды Docker Compose

```bash
# Запуск в фоновом режиме
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Просмотр логов
docker-compose logs -f

# Перезапуск конкретного сервиса
docker-compose restart backend

# Пересборка и запуск
docker-compose up --build
```

## Структура проекта

```
quicket/
├── docker-compose.yml          # Основная конфигурация Docker
├── docker-compose.prod.yml     # Продакшн конфигурация
├── Makefile                    # Удобные команды
├── .env                        # Переменные окружения
├── backend/
│   ├── Dockerfile             # Docker образ для backend
│   ├── entrypoint.sh          # Скрипт запуска backend
│   ├── app.py                 # Основное приложение Flask
│   ├── requirements.txt       # Python зависимости
│   └── ...
├── frontend/
│   ├── Dockerfile             # Docker образ для frontend
│   ├── entrypoint.sh          # Скрипт запуска frontend
│   ├── package.json           # Node.js зависимости
│   ├── vite.config.js         # Конфигурация Vite
│   └── ...
```

## Полезные команды

### Доступ к контейнерам

```bash
# Backend shell
make shell-backend
# или
docker-compose exec backend /bin/bash

# Frontend shell
make shell-frontend
# или
docker-compose exec frontend /bin/sh

# PostgreSQL shell
make shell-postgres
# или
docker-compose exec postgres psql -U postgres -d quicket
```

### Просмотр статуса

```bash
# Статус всех сервисов
make status
# или
docker-compose ps

# Использование ресурсов
docker stats
```

### Работа с базой данных

```bash
# Сброс базы данных (ВНИМАНИЕ: удалит все данные)
make reset-db

# Бэкап базы данных
docker-compose exec postgres pg_dump -U postgres quicket > backup.sql

# Восстановление из бэкапа
docker-compose exec -T postgres psql -U postgres quicket < backup.sql
```

## Решение проблем

### База данных не доступна

```bash
# Проверить статус PostgreSQL
docker-compose logs postgres

# Пересоздать том базы данных
docker-compose down
docker volume rm quicket_postgres_data
docker-compose up -d postgres
```

### Backend не запускается

```bash
# Проверить логи
docker-compose logs backend

# Пересобрать образ
docker-compose build backend
docker-compose up -d backend
```

### Frontend не загружается

```bash
# Проверить логи
docker-compose logs frontend

# Очистить node_modules и пересобрать
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Полная очистка

```bash
# Остановить все и удалить тома
make clean

# Удалить все образы проекта
docker images | grep quicket | awk '{print $3}' | xargs docker rmi -f

# Очистить неиспользуемые ресурсы Docker
docker system prune -a
```

## Переменные окружения

### Backend (.env)
- `DATABASE_URL` - URL подключения к PostgreSQL
- `SECRET_KEY` - Секретный ключ Flask
- `JWT_SECRET_KEY` - Ключ для JWT токенов
- `FLASK_ENV` - Окружение Flask (development/production)

### Frontend (.env)
- `VITE_API_URL` - URL backend API
- `CHOKIDAR_USEPOLLING` - Для hot reload в Docker

### PostgreSQL (.env)
- `POSTGRES_DB` - Имя базы данных
- `POSTGRES_USER` - Пользователь PostgreSQL
- `POSTGRES_PASSWORD` - Пароль PostgreSQL

## Продакшн

Для продакшн-развертывания используйте отдельную конфигурацию:

```bash
# Запуск в продакшн режиме
make prod

# Или напрямую
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Мониторинг

```bash
# Просмотр ресурсов
docker stats

# Логи в реальном времени
docker-compose logs -f

# Проверка состояния здоровья
docker-compose ps
```