#!/bin/bash
# backend/entrypoint.sh

set -e

echo "Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
python -c "
from app import app
from database import db
with app.app_context():
    try:
        db.create_all()
        print('Database tables created successfully!')
    except Exception as e:
        print(f'Error creating tables: {e}')
"

echo "Starting Flask application..."
python -c "
from app import app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
"