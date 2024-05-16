#!/bin/ash

# Change to the app directory
cd /volumeBackend

sleep 15

# Run Django commands with absolute paths
./manage.py collectstatic --noinput
./manage.py makemigrations
./manage.py migrate

celery -A backend worker -l INFO > /dev/null 2>&1 &

# Start Django development server
# python manage.py runserver 0.0.0.0:8000

# python manage.py runserver_plus --cert-file cert.pem --key-file key.pem 0.0.0.0:8000

# daphne -e ssl:8000:privateKey=/tmp/ssl/private/cert_key.key:certKey=/tmp/ssl/certs/cert_key.crt -u /tmp/daphne.sock backend.asgi:application
daphne -e ssl:8000:privateKey=/tmp/ssl/private/cert_key.key:certKey=/tmp/ssl/certs/cert_key.crt --application-close-timeout 120 -u /tmp/daphne.sock backend.asgi:application

