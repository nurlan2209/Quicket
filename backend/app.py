import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, g
from flask_cors import CORS
import hashlib
import secrets
import jwt
from dotenv import load_dotenv
from functools import wraps

from database import db, init_app
from models import User, Event, Venue, Booking, Notification, UserRole, EventType, NotificationType, EventStatus

# Загрузка переменных окружения
load_dotenv()

app = Flask(__name__)
CORS(app)

# Инициализация приложения с базой данных
init_app(app)

# Секретный ключ для JWT
SECRET_KEY = os.getenv("SECRET_KEY", "quicket_default_secret")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "quicket_jwt_secret")

# Соль для хеширования паролей
SALT = os.getenv("SALT", "quicket_salt")

def hash_password(password):
    """Хеширование пароля с солью"""
    return hashlib.sha256((password + SALT).encode()).hexdigest()

def generate_jwt_token(user_id, role):
    """Генерация JWT токена"""
    payload = {
        'user_id': user_id,
        'role': role.value if isinstance(role, UserRole) else role,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Проверяем наличие токена в заголовке Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Токен не предоставлен'}), 401
        
        try:
            # Декодируем токен
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            user_id = payload['user_id']
            role = payload['role']
            
            # Добавляем информацию о пользователе в контекст запроса
            g.user_id = user_id
            g.role = role
            
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Токен истек'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Неверный токен'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Сначала проверяем наличие токена
        token_result = token_required(lambda: None)()
        if isinstance(token_result, tuple) and token_result[1] != 200:
            return token_result
        
        # Проверяем роль пользователя
        if g.role != UserRole.admin.value and g.role != 'admin':
            return jsonify({'success': False, 'message': 'Требуются права администратора'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.password == hash_password(password):
        # Генерируем JWT токен
        token = generate_jwt_token(user.id, user.role)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role.value,
                'token': token
            }
        })

    return jsonify({'success': False, 'message': 'Неверное имя пользователя или пароль'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    # Проверяем, существует ли пользователь с таким именем или email
    existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Пользователь с таким именем или email уже существует'}), 400
    
    try:
        new_user = User(
            username=username,
            password=hash_password(password),
            email=email,
            role=UserRole.user
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Создаем приветственное уведомление
        welcome_notification = Notification(
            user_id=new_user.id,
            title="Добро пожаловать в Quicket!",
            message="Спасибо за регистрацию в нашем сервисе. Теперь вы можете бронировать билеты на различные мероприятия.",
            notification_type=NotificationType.SYSTEM_MESSAGE
        )
        db.session.add(welcome_notification)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Пользователь успешно зарегистрирован'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка регистрации: {str(e)}'}), 400

@app.route('/api/events', methods=['GET'])
def get_events():
    events_query = db.session.query(
        Event, 
        Venue.name.label('venue_name'),
        db.func.count(Booking.id).filter(Booking.status == 'confirmed').label('booked_seats')
    ).join(
        Venue, Event.venue_id == Venue.id
    ).outerjoin(
        Booking, Event.id == Booking.event_id
    ).group_by(
        Event.id, Venue.name
    ).order_by(
        Event.date, Event.time
    )
    
    # Фильтрация по типу мероприятия (если указан)
    event_type = request.args.get('type')
    if event_type:
        events_query = events_query.filter(Event.type == event_type)
    
    # Фильтрация по статусу мероприятия (если указан)
    status = request.args.get('status')
    if status:
        events_query = events_query.filter(Event.status == status)
    
    # Поиск по названию или месту проведения
    search = request.args.get('search')
    if search:
        search_term = f"%{search}%"
        events_query = events_query.filter(
            db.or_(
                Event.title.ilike(search_term),
                Venue.name.ilike(search_term)
            )
        )
    
    # Получение избранных мероприятий
    featured = request.args.get('featured')
    if featured and featured.lower() == 'true':
        events_query = events_query.filter(Event.featured == True)
    
    events_result = events_query.all()
    
    result = []
    for event, venue_name, booked_seats in events_result:
        available_seats = event.total_seats - booked_seats
        
        # Получаем URL первого медиафайла (изображения) для мероприятия, если есть
        image_url = event.image_url
        if not image_url and event.media:
            for media in event.media:
                if media.media_type == 'image':
                    image_url = media.media_url
                    break
        
        result.append({
            'id': event.id,
            'title': event.title,
            'type': event.type.value,
            'venue_id': event.venue_id,
            'venue_name': venue_name,
            'date': event.date.strftime('%Y-%m-%d'),
            'time': event.time,
            'duration': event.duration,
            'total_seats': event.total_seats,
            'available_seats': available_seats,
            'price': event.price,
            'description': event.description,
            'status': event.status.value,
            'image_url': image_url,
            'event_subtype': event.event_subtype,
            'organizer': event.organizer,
            'featured': event.featured
        })

    return jsonify(result)

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event_data = db.session.query(
        Event, 
        Venue,
        db.func.count(Booking.id).filter(Booking.status == 'confirmed').label('booked_seats')
    ).join(
        Venue, Event.venue_id == Venue.id
    ).outerjoin(
        Booking, Event.id == Booking.event_id
    ).filter(
        Event.id == event_id
    ).group_by(
        Event.id, Venue.id
    ).first()
    
    if not event_data:
        return jsonify({'success': False, 'message': 'Мероприятие не найдено'}), 404
    
    event, venue, booked_seats = event_data
    available_seats = event.total_seats - booked_seats
    
    # Получаем все медиафайлы для мероприятия
    media_files = []
    if event.media:
        for media in event.media:
            media_files.append({
                'id': media.id,
                'type': media.media_type,
                'url': media.media_url,
                'description': media.description
            })
    
    result = {
        'id': event.id,
        'title': event.title,
        'type': event.type.value,
        'status': event.status.value,
        'venue_id': event.venue_id,
        'venue_name': venue.name,
        'venue_address': venue.address,
        'venue_latitude': venue.latitude,
        'venue_longitude': venue.longitude,
        'date': event.date.strftime('%Y-%m-%d'),
        'time': event.time,
        'duration': event.duration,
        'total_seats': event.total_seats,
        'available_seats': available_seats,
        'price': event.price,
        'description': event.description,
        'image_url': event.image_url,
        'background_music_url': event.background_music_url,
        'event_subtype': event.event_subtype,
        'organizer': event.organizer,
        'featured': event.featured,
        'media': media_files
    }

    return jsonify(result)

@app.route('/api/events', methods=['POST'])
@admin_required
def create_event():
    data = request.json

    # Обязательные поля
    required_fields = ['title', 'type', 'venue_id', 'date', 'time', 'total_seats', 'price']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Поле {field} обязательно'}), 400
    
    try:
        # Преобразование строки типа мероприятия в Enum
        event_type_str = data['type'].upper()
        try:
            event_type = EventType[event_type_str]
        except KeyError:
            return jsonify({'success': False, 'message': f'Неверный тип мероприятия: {data["type"]}'}), 400
        
        # Создаем новое мероприятие
        new_event = Event(
            title=data['title'],
            type=event_type,
            venue_id=data['venue_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d'),
            time=data['time'],
            duration=data.get('duration', 60),
            total_seats=data['total_seats'],
            price=data['price'],
            description=data.get('description', ''),
            event_subtype=data.get('event_subtype'),
            image_url=data.get('image_url'),
            background_music_url=data.get('background_music_url'),
            organizer=data.get('organizer'),
            featured=data.get('featured', False),
            status=EventStatus.UPCOMING
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        # Добавляем медиафайлы, если есть
        media_files = data.get('media', [])
        for media_file in media_files:
            if 'type' in media_file and 'url' in media_file:
                media = EventMedia(
                    event_id=new_event.id,
                    media_type=media_file['type'],
                    media_url=media_file['url'],
                    description=media_file.get('description', '')
                )
                db.session.add(media)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Мероприятие успешно создано',
            'event_id': new_event.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при создании мероприятия: {str(e)}'}), 500

@app.route('/api/events/<int:event_id>', methods=['PUT'])
@admin_required
def update_event(event_id):
    data = request.json
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'success': False, 'message': 'Мероприятие не найдено'}), 404
    
    try:
        # Обновляем поля мероприятия, если они указаны
        if 'title' in data:
            event.title = data['title']
        
        if 'type' in data:
            try:
                event_type_str = data['type'].upper()
                event.type = EventType[event_type_str]
            except KeyError:
                return jsonify({'success': False, 'message': f'Неверный тип мероприятия: {data["type"]}'}), 400
        
        if 'venue_id' in data:
            event.venue_id = data['venue_id']
        
        if 'date' in data:
            event.date = datetime.strptime(data['date'], '%Y-%m-%d')
        
        if 'time' in data:
            event.time = data['time']
        
        if 'duration' in data:
            event.duration = data['duration']
        
        if 'total_seats' in data:
            # Проверяем, не меньше ли новое количество мест, чем уже забронировано
            booked_seats = db.session.query(db.func.count(Booking.id)).filter(
                Booking.event_id == event_id, 
                Booking.status == 'confirmed'
            ).scalar()
            
            if data['total_seats'] < booked_seats:
                return jsonify({
                    'success': False, 
                    'message': f'Новое количество мест ({data["total_seats"]}) меньше, чем уже забронировано ({booked_seats})'
                }), 400
                
            event.total_seats = data['total_seats']
        
        if 'price' in data:
            event.price = data['price']
        
        if 'description' in data:
            event.description = data['description']
        
        if 'event_subtype' in data:
            event.event_subtype = data['event_subtype']
        
        if 'image_url' in data:
            event.image_url = data['image_url']
        
        if 'background_music_url' in data:
            event.background_music_url = data['background_music_url']
        
        if 'organizer' in data:
            event.organizer = data['organizer']
        
        if 'featured' in data:
            event.featured = data['featured']
        
        if 'status' in data:
            try:
                status_str = data['status'].upper()
                event.status = EventStatus[status_str]
                
                # Если статус изменился на CANCELLED, отправляем уведомления всем, кто забронировал
                if event.status == EventStatus.CANCELLED:
                    # Получаем всех пользователей, у которых есть активные бронирования
                    bookings = Booking.query.filter(
                        Booking.event_id == event_id,
                        Booking.status == 'confirmed'
                    ).all()
                    
                    for booking in bookings:
                        notification = Notification(
                            user_id=booking.user_id,
                            title="Мероприятие отменено",
                            message=f"Мероприятие '{event.title}' было отменено. Ваше бронирование будет автоматически отменено.",
                            notification_type=NotificationType.EVENT_CANCELLED,
                            related_id=event_id
                        )
                        db.session.add(notification)
                        
                        # Отменяем бронирование
                        booking.status = 'cancelled'
            except KeyError:
                return jsonify({'success': False, 'message': f'Неверный статус мероприятия: {data["status"]}'}), 400
        
        # Обновляем медиафайлы, если они указаны
        if 'media' in data:
            # Удаляем старые медиафайлы
            if 'delete_all_media' in data and data['delete_all_media']:
                for media in event.media:
                    db.session.delete(media)
            
            # Добавляем новые медиафайлы
            for media_file in data['media']:
                if 'type' in media_file and 'url' in media_file:
                    media = EventMedia(
                        event_id=event.id,
                        media_type=media_file['type'],
                        media_url=media_file['url'],
                        description=media_file.get('description', '')
                    )
                    db.session.add(media)
        
        db.session.commit()
        
        # Отправляем уведомления о обновлении мероприятия всем, кто забронировал (если статус не CANCELLED)
        if event.status != EventStatus.CANCELLED and 'notify_users' in data and data['notify_users']:
            bookings = Booking.query.filter(
                Booking.event_id == event_id,
                Booking.status == 'confirmed'
            ).all()
            
            for booking in bookings:
                notification = Notification(
                    user_id=booking.user_id,
                    title="Обновление мероприятия",
                    message=f"Мероприятие '{event.title}' было обновлено. Проверьте детали вашего бронирования.",
                    notification_type=NotificationType.EVENT_UPDATED,
                    related_id=event_id,
                    action_link=f"/events/{event_id}"
                )
                db.session.add(notification)
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Мероприятие успешно обновлено'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при обновлении мероприятия: {str(e)}'}), 500

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@admin_required
def delete_event(event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'success': False, 'message': 'Мероприятие не найдено'}), 404
    
    try:
        # Проверяем, есть ли активные бронирования
        active_bookings = Booking.query.filter(
            Booking.event_id == event_id,
            Booking.status == 'confirmed'
        ).count()
        
        if active_bookings > 0:
            # Вместо удаления меняем статус на CANCELLED и отправляем уведомления
            event.status = EventStatus.CANCELLED
            
            # Получаем всех пользователей, у которых есть активные бронирования
            bookings = Booking.query.filter(
                Booking.event_id == event_id,
                Booking.status == 'confirmed'
            ).all()
            
            for booking in bookings:
                notification = Notification(
                    user_id=booking.user_id,
                    title="Мероприятие отменено",
                    message=f"Мероприятие '{event.title}' было отменено. Ваше бронирование будет автоматически отменено.",
                    notification_type=NotificationType.EVENT_CANCELLED,
                    related_id=event_id
                )
                db.session.add(notification)
                
                # Отменяем бронирование
                booking.status = 'cancelled'
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Мероприятие было отменено, так как есть активные бронирования'
            })
        else:
            # Если нет активных бронирований, удаляем мероприятие
            db.session.delete(event)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Мероприятие успешно удалено'
            })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при удалении мероприятия: {str(e)}'}), 500

# API для бронирования места на мероприятии
@app.route('/api/bookings', methods=['POST'])
@token_required
def create_booking():
    data = request.json
    user_id = g.user_id  # Получаем ID пользователя из JWT токена
    event_id = data.get('event_id')
    seats = data.get('seats', 1)
    
    if not event_id:
        return jsonify({'success': False, 'message': 'ID мероприятия обязателен'}), 400
    
    # Проверяем наличие свободных мест
    event_data = db.session.query(
        Event,
        db.func.count(Booking.id).filter(Booking.status == 'confirmed').label('booked_seats')
    ).outerjoin(
        Booking, Event.id == Booking.event_id
    ).filter(
        Event.id == event_id
    ).group_by(
        Event.id
    ).first()
    
    if not event_data:
        return jsonify({'success': False, 'message': 'Мероприятие не найдено'}), 404
    
    event, booked_seats = event_data
    available_seats = event.total_seats - booked_seats
    
    if available_seats < seats:
        return jsonify({'success': False, 'message': f'Недостаточно мест. Доступно: {available_seats}'}), 400
    
    try:
        new_booking = Booking(
            user_id=user_id,
            event_id=event_id,
            seats=seats,
            status='confirmed'
        )
        db.session.add(new_booking)
        db.session.commit()
        
        # Создаем уведомление о бронировании
        notification = Notification(
            user_id=user_id,
            title="Бронирование создано",
            message=f"Вы успешно забронировали {seats} мест на мероприятие '{event.title}'.",
            notification_type=NotificationType.BOOKING_CREATED,
            related_id=new_booking.id,
            action_link=f"/bookings"
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Бронирование успешно создано',
            'booking_id': new_booking.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при создании бронирования: {str(e)}'}), 500

# API для получения бронирований пользователя
@app.route('/api/users/<int:user_id>/bookings', methods=['GET'])
@token_required
def get_user_bookings(user_id):
    # Проверяем, запрашивает ли пользователь свои бронирования или админ запрашивает чужие
    if g.user_id != user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    bookings = db.session.query(
        Booking,
        Event,
        Venue
    ).join(
        Event, Booking.event_id == Event.id
    ).join(
        Venue, Event.venue_id == Venue.id
    ).filter(
        Booking.user_id == user_id
    ).order_by(
        Event.date, Event.time
    ).all()
    
    result = []
    for booking, event, venue in bookings:
        result.append({
            'id': booking.id,
            'event_id': booking.event_id,
            'event_title': event.title,
            'event_date': event.date.strftime('%Y-%m-%d'),
            'event_time': event.time,
            'venue_name': venue.name,
            'seats': booking.seats,
            'status': booking.status,
            'total_price': booking.seats * event.price,
            'created_at': booking.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'event_image': event.image_url
        })
    
    return jsonify(result)

# API для отмены бронирования
@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
@token_required
def cancel_booking(booking_id):
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'success': False, 'message': 'Бронирование не найдено'}), 404
    
    # Проверяем, отменяет ли пользователь свое бронирование или админ отменяет чужое
    if g.user_id != booking.user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'У вас нет прав для отмены этого бронирования'}), 403
    
    try:
        booking.status = 'cancelled'
        db.session.commit()
        
        # Получаем информацию о мероприятии для уведомления
        event = Event.query.get(booking.event_id)
        
        # Создаем уведомление об отмене бронирования
        notification = Notification(
            user_id=booking.user_id,
            title="Бронирование отменено",
            message=f"Ваше бронирование на мероприятие '{event.title}' было отменено.",
            notification_type=NotificationType.BOOKING_CANCELLED,
            related_id=booking.id
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Бронирование успешно отменено'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при отмене бронирования: {str(e)}'}), 500

# API для получения всех спортивных объектов
@app.route('/api/venues', methods=['GET'])
def get_venues():
    venues = Venue.query.order_by(Venue.name).all()
    
    result = []
    for venue in venues:
        result.append({
            'id': venue.id,
            'name': venue.name,
            'address': venue.address,
            'description': venue.description,
            'capacity': venue.capacity,
            'latitude': venue.latitude,
            'longitude': venue.longitude
        })
    
    return jsonify(result)

# API для получения информации о конкретном спортивном объекте
@app.route('/api/venues/<int:venue_id>', methods=['GET'])
def get_venue(venue_id):
    venue = Venue.query.get(venue_id)
    
    if not venue:
        return jsonify({'success': False, 'message': 'Спортивный объект не найден'}), 404
    
    # Получаем все мероприятия, проводимые на данном объекте
    events = db.session.query(
        Event, 
        db.func.count(Booking.id).filter(Booking.status == 'confirmed').label('booked_seats')
    ).outerjoin(
        Booking, Event.id == Booking.event_id
    ).filter(
        Event.venue_id == venue_id
    ).group_by(
        Event.id
    ).all()
    
    events_data = []
    for event, booked_seats in events:
        events_data.append({
            'id': event.id,
            'title': event.title,
            'type': event.type.value,
            'date': event.date.strftime('%Y-%m-%d'),
            'time': event.time,
            'available_seats': event.total_seats - booked_seats,
            'total_seats': event.total_seats,
            'price': event.price
        })
    
    result = {
        'id': venue.id,
        'name': venue.name,
        'address': venue.address,
        'description': venue.description,
        'capacity': venue.capacity,
        'latitude': venue.latitude,
        'longitude': venue.longitude,
        'events': events_data
    }
    
    return jsonify(result)

# API для создания спортивного объекта (только для админов)
@app.route('/api/venues', methods=['POST'])
@admin_required
def create_venue():
    data = request.json
    
    # Обязательные поля
    required_fields = ['name', 'address', 'capacity']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'Поле {field} обязательно'}), 400
    
    try:
        venue = Venue(
            name=data['name'],
            address=data['address'],
            description=data.get('description', ''),
            capacity=data['capacity'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        
        db.session.add(venue)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Спортивный объект успешно создан',
            'venue_id': venue.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при создании спортивного объекта: {str(e)}'}), 500

# API для обновления информации о спортивном объекте
@app.route('/api/venues/<int:venue_id>', methods=['PUT'])
@admin_required
def update_venue(venue_id):
    data = request.json
    
    venue = Venue.query.get(venue_id)
    if not venue:
        return jsonify({'success': False, 'message': 'Спортивный объект не найден'}), 404
    
    try:
        if 'name' in data:
            venue.name = data['name']
        
        if 'address' in data:
            venue.address = data['address']
        
        if 'description' in data:
            venue.description = data['description']
        
        if 'capacity' in data:
            venue.capacity = data['capacity']
        
        if 'latitude' in data:
            venue.latitude = data['latitude']
        
        if 'longitude' in data:
            venue.longitude = data['longitude']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Спортивный объект успешно обновлен'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при обновлении спортивного объекта: {str(e)}'}), 500

# API для удаления спортивного объекта
@app.route('/api/venues/<int:venue_id>', methods=['DELETE'])
@admin_required
def delete_venue(venue_id):
    venue = Venue.query.get(venue_id)
    if not venue:
        return jsonify({'success': False, 'message': 'Спортивный объект не найден'}), 404
    
    # Проверяем, связан ли объект с мероприятиями
    events_count = Event.query.filter_by(venue_id=venue_id).count()
    
    if events_count > 0:
        return jsonify({
            'success': False,
            'message': 'Невозможно удалить, так как объект связан с мероприятиями'
        }), 400
    
    try:
        db.session.delete(venue)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Спортивный объект успешно удален'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка при удалении спортивного объекта: {str(e)}'}), 500

# API для управления уведомлениями

# Получение уведомлений пользователя
@app.route('/api/users/<int:user_id>/notifications', methods=['GET'])
@token_required
def get_user_notifications(user_id):
    # Проверяем права
    if g.user_id != user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    # Параметры запроса
    limit = request.args.get('limit', default=None, type=int)
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)
    unread_only = request.args.get('unread_only', default='false').lower() == 'true'
    
    # Базовый запрос
    query = Notification.query.filter_by(user_id=user_id)
    
    # Применяем фильтры
    if unread_only:
        query = query.filter_by(read=False)
    
    # Сортировка по дате создания (сначала новые)
    query = query.order_by(Notification.created_at.desc())
    
    # Если задан предел, используем его, иначе используем пагинацию
    if limit:
        notifications = query.limit(limit).all()
        total = min(limit, query.count())
    else:
        # Пагинация
        offset = (page - 1) * per_page
        notifications = query.offset(offset).limit(per_page).all()
        total = query.count()
    
    result = []
    for notification in notifications:
        result.append({
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'notification_type': notification.notification_type.value,
            'read': notification.read,
            'action_link': notification.action_link,
            'related_id': notification.related_id,
            'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify({
        'success': True,
        'notifications': result,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    })

# Получение количества непрочитанных уведомлений
@app.route('/api/users/<int:user_id>/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_notifications_count(user_id):
    # Проверяем права
    if g.user_id != user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    count = Notification.query.filter_by(user_id=user_id, read=False).count()
    
    return jsonify({
        'success': True,
        'count': count
    })

# Отметить уведомление как прочитанное
@app.route('/api/notifications/<int:notification_id>/read', methods=['PATCH'])
@token_required
def mark_notification_as_read(notification_id):
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'success': False, 'message': 'Уведомление не найдено'}), 404
    
    # Проверяем права
    if g.user_id != notification.user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    try:
        notification.read = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Уведомление отмечено как прочитанное'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка: {str(e)}'}), 500

# Отметить все уведомления пользователя как прочитанные
@app.route('/api/users/<int:user_id>/notifications/mark-all-read', methods=['PATCH'])
@token_required
def mark_all_notifications_as_read(user_id):
    # Проверяем права
    if g.user_id != user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    try:
        # Обновляем все непрочитанные уведомления пользователя
        Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Все уведомления отмечены как прочитанные'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка: {str(e)}'}), 500

# Удалить уведомление
@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'success': False, 'message': 'Уведомление не найдено'}), 404
    
    # Проверяем права
    if g.user_id != notification.user_id and g.role != UserRole.admin.value and g.role != 'admin':
        return jsonify({'success': False, 'message': 'Нет доступа'}), 403
    
    try:
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Уведомление удалено'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка: {str(e)}'}), 500

# API для админ-панели

# Получение статистики по бронированиям
@app.route('/api/admin/stats/bookings', methods=['GET'])
@admin_required
def get_booking_stats():
    # Статистика по статусам бронирований
    status_stats = db.session.query(
        Booking.status,
        db.func.count(Booking.id)
    ).group_by(Booking.status).all()
    
    status_data = {status: count for status, count in status_stats}
    
    # Статистика по дням (последние 30 дней)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    daily_stats = db.session.query(
        db.func.date(Booking.created_at),
        db.func.count(Booking.id)
    ).filter(
        Booking.created_at >= thirty_days_ago
    ).group_by(
        db.func.date(Booking.created_at)
    ).all()
    
    daily_data = {str(date): count for date, count in daily_stats}
    
    # Статистика по мероприятиям (топ-5 по количеству бронирований)
    top_events = db.session.query(
        Event.id,
        Event.title,
        db.func.count(Booking.id).label('bookings_count')
    ).join(
        Booking, Event.id == Booking.event_id
    ).group_by(
        Event.id, Event.title
    ).order_by(
        db.desc('bookings_count')
    ).limit(5).all()
    
    top_events_data = [
        {'id': id, 'title': title, 'bookings_count': count}
        for id, title, count in top_events
    ]
    
    # Общее количество бронирований
    total_bookings = Booking.query.count()
    
    return jsonify({
        'success': True,
        'total_bookings': total_bookings,
        'status_stats': status_data,
        'daily_stats': daily_data,
        'top_events': top_events_data
    })

# Получение статистики по мероприятиям
@app.route('/api/admin/stats/events', methods=['GET'])
@admin_required
def get_event_stats():
    # Статистика по типам мероприятий
    type_stats = db.session.query(
        Event.type,
        db.func.count(Event.id)
    ).group_by(Event.type).all()
    
    type_data = {type.value: count for type, count in type_stats}
    
    # Статистика по статусам мероприятий
    status_stats = db.session.query(
        Event.status,
        db.func.count(Event.id)
    ).group_by(Event.status).all()
    
    status_data = {status.value: count for status, count in status_stats}
    
    # Общее количество мероприятий
    total_events = Event.query.count()
    
    # Загруженность спортивных объектов (топ-5)
    venue_stats = db.session.query(
        Venue.id,
        Venue.name,
        db.func.count(Event.id).label('events_count')
    ).join(
        Event, Venue.id == Event.venue_id
    ).group_by(
        Venue.id, Venue.name
    ).order_by(
        db.desc('events_count')
    ).limit(5).all()
    
    venue_data = [
        {'id': id, 'name': name, 'events_count': count}
        for id, name, count in venue_stats
    ]
    
    return jsonify({
        'success': True,
        'total_events': total_events,
        'type_stats': type_data,
        'status_stats': status_data,
        'venue_stats': venue_data
    })

# Получение статистики по пользователям
@app.route('/api/admin/stats/users', methods=['GET'])
@admin_required
def get_user_stats():
    # Общее количество пользователей
    total_users = User.query.count()
    
    # Количество администраторов
    admin_count = User.query.filter_by(role=UserRole.admin).count()
    
    # Топ-5 пользователей по количеству бронирований
    top_users = db.session.query(
        User.id,
        User.username,
        db.func.count(Booking.id).label('bookings_count')
    ).join(
        Booking, User.id == Booking.user_id
    ).group_by(
        User.id, User.username
    ).order_by(
        db.desc('bookings_count')
    ).limit(5).all()
    
    top_users_data = [
        {'id': id, 'username': username, 'bookings_count': count}
        for id, username, count in top_users
    ]
    
    # Статистика по времени регистрации (по месяцам)
    monthly_stats = db.session.query(
        db.func.strftime('%Y-%m', User.created_at),
        db.func.count(User.id)
    ).group_by(
        db.func.strftime('%Y-%m', User.created_at)
    ).all()
    
    monthly_data = {month: count for month, count in monthly_stats}
    
    return jsonify({
        'success': True,
        'total_users': total_users,
        'admin_count': admin_count,
        'top_users': top_users_data,
        'monthly_stats': monthly_data
    })

# Административный API для управления пользователями
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    users = User.query.all()
    
    result = []
    for user in users:
        result.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify(result)

# Изменение роли пользователя
@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    data = request.json
    new_role = data.get('role')
    
    if not new_role:
        return jsonify({'success': False, 'message': 'Роль не указана'}), 400
    
    try:
        # Преобразуем строку роли в Enum
        user_role = UserRole[new_role.lower()]
    except KeyError:
        return jsonify({'success': False, 'message': f'Неверная роль: {new_role}'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Пользователь не найден'}), 404
    
    try:
        user.role = user_role
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Роль пользователя успешно обновлена'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка: {str(e)}'}), 500
    
    
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)