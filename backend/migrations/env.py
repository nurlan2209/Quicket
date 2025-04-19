import os
import sys

# Добавляем родительскую директорию backend в sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Импортируем модели
from models import db

# Загружаем переменные окружения из .env файла
load_dotenv()

# Alembic Config
config = context.config
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

# Настройка логгирования
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Цель для автогенерации миграций
target_metadata = db.metadata

# Обычные функции миграций
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
