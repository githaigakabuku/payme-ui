# Deployment Guide

## Prerequisites

- Docker & Docker Compose (for containerized deployment)
- OR Python 3.10+, PostgreSQL 12+, Redis (for traditional deployment)
- Stripe account with API keys
- AWS S3 bucket (optional, for PDF storage)
- Domain with SSL certificate (for production)

---

## Quick Start (Docker)

### 1. Clone and Configure

```bash
cd /path/to/project
cp .env.example .env
```

### 2. Update `.env` with Your Configuration

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=db
DB_PORT=5432

# Stripe
STRIPE_PUBLIC_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_live_your_key

# Admin user created by migration
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@yourdomain.com
DJANGO_SUPERUSER_PASSWORD=change-this-strong-password

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create test data (optional)
docker-compose exec web python manage.py create_test_data
```

### 4. Verify Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f web
```

### 5. Access Application

- **API:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin
- **Database:** localhost:5432
- **Redis:** localhost:6379

## Render Deployment

Use the following start command
on Render:

```bash
gunicorn core.wsgi:application --chdir backend --bind 0.0.0.0:$PORT
```

The repo also includes a [Procfile](Procfile) with the same command, so Render can start the app as a web service.

Make sure `CORS_ALLOWED_ORIGINS` contains real URLs such as `https://your-app.onrender.com`, not `True` or `False`.

---

## Traditional Deployment (Linux Server)

### 1. System Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y python3.10 python3.10-venv python3-pip
sudo apt-get install -y postgresql postgresql-contrib
sudo apt-get install -y redis-server
sudo apt-get install -y nginx
sudo apt-get install -y supervisor
```

### 2. PostgreSQL Setup

```bash
sudo -u postgres psql
CREATE DATABASE contract_management;
CREATE USER contract_user WITH PASSWORD 'secure_password';
ALTER ROLE contract_user SET client_encoding TO 'utf8';
ALTER ROLE contract_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE contract_user SET default_transaction_deferrable TO on;
ALTER ROLE contract_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE contract_management TO contract_user;
\q
```

### 3. Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/contract_management
cd /var/www/contract_management

# Clone repository (if applicable)
git clone <your-repo> .

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with production values
```

### 4. Django Configuration

```bash
# Run migrations
python manage.py migrate

# Create test data
python manage.py create_test_data

# Collect static files
python manage.py collectstatic --noinput

# Verify no errors
python manage.py check
```

### 5. Gunicorn Configuration

```bash
# Test Gunicorn
gunicorn --bind 0.0.0.0:8000 core.wsgi:application

# Create systemd service
sudo nano /etc/systemd/system/gunicorn.service
```

**Content for `/etc/systemd/system/gunicorn.service`:**

```ini
[Unit]
Description=Contract Management Gunicorn Service
After=network.target
Requires=gunicorn.socket

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/contract_management
ExecStart=/var/www/contract_management/venv/bin/gunicorn \
    --workers=4 \
    --timeout=120 \
    --bind=unix:/var/run/gunicorn.sock \
    core.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6. Nginx Configuration

**Create `/etc/nginx/sites-available/contract_management`:**

```nginx
upstream gunicorn_backend {
    server unix:/var/run/gunicorn.sock;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://gunicorn_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /var/www/contract_management/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /var/www/contract_management/media/;
        expires 7d;
    }
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/contract_management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Enable SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. Start Services

```bash
# Enable and start Gunicorn
sudo systemctl enable gunicorn
sudo systemctl start gunicorn

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Setup Celery with supervisor
sudo nano /etc/supervisor/conf.d/contract_celery.conf
```

**Content for Celery supervisor config:**

```ini
[program:contract_celery]
process_name=%(program_name)s
command=/var/www/contract_management/venv/bin/celery -A core worker -l info
directory=/var/www/contract_management
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/contract_celery.log

[program:contract_celery_beat]
process_name=%(program_name)s
command=/var/www/contract_management/venv/bin/celery -A core beat -l info
directory=/var/www/contract_management
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/contract_celery_beat.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

---

## Production Checklist

### Security

- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Enable `SECURE_SSL_REDIRECT=True`
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Configure firewall (UFW)
- [ ] Use environment variables for all secrets
- [ ] Regular security updates

### Performance

- [ ] Configure CDN for static assets
- [ ] Enable gzip compression in Nginx
- [ ] Setup database backups
- [ ] Monitor disk space
- [ ] Configure log rotation
- [ ] Use connection pooling for database

### Monitoring

- [ ] Setup error tracking (Sentry recommended)
- [ ] Configure logging to centralized system
- [ ] Setup uptime monitoring
- [ ] Monitor application performance
- [ ] Alert on critical errors

### Database

- [ ] Regular automated backups
- [ ] Test restore procedures
- [ ] Optimize indexes
- [ ] Monitor query performance
- [ ] Connection pooling configured

### Stripe Integration

- [ ] Webhook endpoint configured
- [ ] Webhook signature validation enabled
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook processing

### Backup Strategy

```bash
# Automated database backup script
#!/bin/bash
BACKUP_DIR="/var/backups/contract_management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U contract_user contract_management | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -mtime +30 -delete
```

Add to crontab:

```bash
0 2 * * * /usr/local/bin/backup_database.sh
```

---

## Environment Variables Reference

**Development (.env):**

```
DEBUG=True
SECRET_KEY=dev-key-change-this
ALLOWED_HOSTS=localhost,127.0.0.1
DB_HOST=localhost
USE_S3=False
```

**Production (.env.production):**

```
DEBUG=False
SECRET_KEY=production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_HOST=prod-db.example.com
DB_PASSWORD=strong-password
USE_S3=True
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

---

## Troubleshooting

### Django Not Starting

```bash
# Check for syntax errors
python manage.py check

# Check logs
tail -f /var/log/gunicorn.log

# Run in foreground for debugging
python manage.py runserver
```

### Database Connection Issues

```bash
# Test database connection
psql -U contract_user -d contract_management -h localhost

# Check database status
sudo systemctl status postgresql

# View database logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Stripe Webhook Not Working

```bash
# Check webhook configuration in Stripe dashboard
# Verify endpoint URL is accessible
curl -I https://yourdomain.com/api/payments/webhook/stripe/

# Check webhook secret in .env
grep STRIPE_WEBHOOK_SECRET .env

# Monitor webhook processing
tail -f logs/django.log | grep webhook
```

### Static Files Not Loading

```bash
# Recollect static files
python manage.py collectstatic --noinput --clear

# Check permissions
sudo chown -R www-data:www-data /var/www/contract_management/staticfiles/

# Verify Nginx configuration
sudo nginx -t
```

---

## Performance Optimization

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_contract_client_signed ON contracts_contract(client_id, is_signed);
CREATE INDEX idx_milestone_status ON payments_paymentmilestone(status);
CREATE INDEX idx_audit_created ON audit_auditlog(created_at DESC);
```

### Caching

In `settings.py`:

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/contracts/

# Using Locust
pip install locust
locust -f locustfile.py --host=http://localhost:8000
```

---

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install new dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart gunicorn
```

---

## Support & Monitoring

### Health Check Endpoint

```bash
GET /api/auth/token/
# If accessible, system is running
```

### Status Information

- Logs: `/var/www/contract_management/logs/`
- Database: PostgreSQL on port 5432
- Cache: Redis on port 6379
- Web Server: Nginx on port 80/443
- Application: Gunicorn on unix socket

### Log Rotation

Configure in `/etc/logrotate.d/contract_management`:

```
/var/www/contract_management/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```
