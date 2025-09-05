# Deployment Guide

## 🚀 Deployment na Produkcji

### Wymagania
- Node.js 18+
- PostgreSQL 12+
- PM2 (do zarządzania procesami)
- Nginx (reverse proxy)

### 1. Przygotowanie Serwera

```bash
# Instalacja Node.js i PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Instalacja PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

### 2. Konfiguracja Bazy Danych

```sql
-- Logowanie jako postgres user
sudo -u postgres psql

-- Tworzenie bazy danych
CREATE DATABASE roza_modlitewna;
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE roza_modlitewna TO app_user;
```

### 3. Deployment Aplikacji

```bash
# Klonowanie repo
git clone <repository-url>
cd roza-modlitewna-app

# Instalacja dependencies
npm run install:all

# Konfiguracja środowiska
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edytuj pliki .env z danymi produkcyjnymi
```

### 4. Konfiguracja Backend .env

```env
DATABASE_URL="postgresql://app_user:secure_password@localhost:5432/roza_modlitewna"
JWT_SECRET="super-secure-jwt-secret-for-production"
PORT=3001
NODE_ENV=production
```

### 5. Konfiguracja Frontend .env

```env
VITE_API_URL=https://api.yourdomain.com
```

### 6. Build i Deployment

```bash
# Build aplikacji
npm run build

# Uruchomienie migracji
npm run migrate

# Uruchomienie z PM2
pm2 start backend/dist/index.js --name "roza-backend"
pm2 startup
pm2 save
```

### 7. Konfiguracja Nginx

```nginx
# /etc/nginx/sites-available/roza-modlitewna
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/roza-modlitewna-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🐳 Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: roza_modlitewna
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://app_user:secure_password@database:5432/roza_modlitewna
      JWT_SECRET: super-secure-jwt-secret
    depends_on:
      - database

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 📊 Monitoring i Backup

### PM2 Monitoring
```bash
pm2 status
pm2 logs
pm2 restart all
```

### Database Backup
```bash
# Backup
pg_dump -U app_user -h localhost roza_modlitewna > backup.sql

# Restore
psql -U app_user -h localhost roza_modlitewna < backup.sql
```

### Automatyczny Backup (crontab)
```bash
# Backup codziennie o 2:00
0 2 * * * /usr/bin/pg_dump -U app_user roza_modlitewna > /backups/roza_$(date +\%Y\%m\%d).sql
```
