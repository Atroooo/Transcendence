FROM python:alpine

ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache python3-dev \
    && pip3 install --upgrade pip

RUN apk add --no-cache \
    openssl \
    build-base \
    libffi-dev \
    openssl-dev \
    python3-dev

RUN mkdir -p /tmp/ssl/private && mkdir -p /tmp/ssl/certs

# Generate a self-signed SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /tmp/ssl/private/cert_key.key \
    -out /tmp/ssl/certs/cert_key.crt \
    -subj "/C=FR/ST=RHONE/L=LYON/O=42 Lyon/OU=42/CN=localhost/UID=Transcendence"

# Set permissions for the SSL certificate files
RUN chmod 600 /tmp/ssl/private/cert_key.key && chmod 644 /tmp/ssl/certs/cert_key.crt

COPY ./Web/backend/requirements.txt requirements.txt

RUN pip install daphne twisted[tls]
RUN pip install -r requirements.txt 

COPY ./Docker/backend/entrypoint.sh entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

CMD ["/entrypoint.sh"]
