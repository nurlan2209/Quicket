import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

# Создание объекта метаданных с соглашениями по именованию для PostgreSQL
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
db = SQLAlchemy(metadata=metadata)

# Получение URL базы данных из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/quicket")

def init_app(app):
    """Инициализация приложения с настройками базы данных"""
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    return app