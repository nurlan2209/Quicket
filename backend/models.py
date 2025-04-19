from datetime import datetime
from database import db
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

class UserRole(enum.Enum):
    user = "user"
    admin = "admin"

class EventType(enum.Enum):
    SPORT = "sport"
    CONCERT = "concert"
    THEATER = "theater"
    EXHIBITION = "exhibition"
    WORKSHOP = "workshop"
    OTHER = "other"

class EventStatus(enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    FINISHED = "finished"
    CANCELLED = "cancelled"

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи с другими таблицами
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"

class Venue(db.Model):
    __tablename__ = 'venues'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    description = Column(Text)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Геолокация для карты
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Связи с другими таблицами
    events = relationship("Event", back_populates="venue", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Venue {self.name}>"

class Event(db.Model):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    type = Column(Enum(EventType), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.UPCOMING)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String(5), nullable=False)  # формат HH:MM
    duration = Column(Integer, default=60)  # в минутах
    total_seats = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Дополнительные поля для типизации
    event_subtype = Column(String(50), nullable=True)  # подтип мероприятия
    image_url = Column(String(255), nullable=True)  # URL главного изображения
    background_music_url = Column(String(255), nullable=True)  # URL для фоновой музыки
    organizer = Column(String(100), nullable=True)  # организатор мероприятия
    featured = Column(Boolean, default=False)  # избранное мероприятие
    
    # Связи с другими таблицами
    venue = relationship("Venue", back_populates="events")
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")
    media = relationship("EventMedia", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Event {self.title}>"

class EventMedia(db.Model):
    __tablename__ = 'event_media'
    
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey('events.id'))
    media_type = Column(String(50), nullable=False)  # image, video, audio
    media_url = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связь с Event
    event = relationship("Event", back_populates="media")
    
    def __repr__(self):
        return f"<EventMedia {self.media_type} for {self.event_id}>"

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    seats = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default='confirmed', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи с другими таблицами
    user = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    
    def __repr__(self):
        return f"<Booking {self.id} by {self.user_id} for {self.event_id}>"

class NotificationType(enum.Enum):
    BOOKING_CREATED = "booking_created"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_REMINDER = "booking_reminder"
    EVENT_UPDATED = "event_updated"
    EVENT_CANCELLED = "event_cancelled"
    SYSTEM_MESSAGE = "system_message"

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    read = Column(Boolean, default=False)
    action_link = Column(String(255), nullable=True)  # Опциональная ссылка для действия
    related_id = Column(Integer, nullable=True)  # ID связанной сущности (например, booking_id)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связь с User
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id} for user {self.user_id}>"