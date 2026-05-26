# Running USSD Platform on Localhost

## Prerequisites — install these first

### Option A: Docker Desktop (Easiest — recommended)
Install Docker Desktop for your OS:
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Mac**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

This gives you everything in one click.

### Option B: Manual install
- **Java 17+**: https://adoptium.net
- **Maven**: https://maven.apache.org/download.cgi
- **Node.js 20+**: https://nodejs.org
- **PostgreSQL 16**: https://www.postgresql.org/download
- **Redis**: https://redis.io/docs/getting-started/installation

---

## Quickest path — Docker Compose (5 minutes)

Once Docker Desktop is running:

```bash
# 1. Clone the repo
git clone https://github.com/alhassanmr/ussd-platform.git
cd ussd-platform

# 2. Copy the environment file
cp .env.example .env
# (no edits needed for local testing — defaults work)

# 3. Start everything
docker-compose up --build
```

That's it. Visit:
- **App**: http://localhost:3000
- **API**: http://localhost:8080
- **Admin**: http://localhost:3000/admin

---

## Manual path (if you prefer no Docker)

### Step 1 — Start PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb ussd_platform
```

**Windows:**
Download installer from https://www.postgresql.org/download/windows/
Then in psql:
```sql
CREATE DATABASE ussd_platform;
CREATE USER ussd_user WITH PASSWORD 'ussd_pass';
GRANT ALL PRIVILEGES ON DATABASE ussd_platform TO ussd_user;
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb ussd_platform
sudo -u postgres psql -c "CREATE USER ussd_user WITH PASSWORD 'ussd_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ussd_platform TO ussd_user;"
```

### Step 2 — Start Redis

**Mac:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases
Or use WSL2 and run: `sudo apt install redis-server && redis-server`

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

### Step 3 — Start the backend

```bash
cd ussd-platform/backend
mvn spring-boot:run
```

Wait for: `Started UssdPlatformApplication in X seconds`

### Step 4 — Start the frontend

```bash
cd ussd-platform/frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Create your admin account

Once the backend is running, run this once:

```bash
curl -X POST http://localhost:8080/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "X-Setup-Secret: CHANGE_ME_BEFORE_DEPLOY" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "fullName": "Admin"
  }'
```

Then go to http://localhost:3000/admin and log in.

---

## Test the full flow

### 1. Register a tenant
Go to http://localhost:3000 → Sign up → fill in company name, email, password

### 2. Create a USSD app
Dashboard → New app → fill in name, pick Africa's Talking, click Create

### 3. Build a menu
Open the app → Menu Builder → add items:
- Item 1: Type=DISPLAY, Label="Check Balance", Order=1
- Item 2: Type=DISPLAY, Label="Buy Airtime", Order=2
- Item 3: Type=END, Label="Exit", End message="Thank you!", Order=3

### 4. Get your webhook URL
Open the app → Integration tab → copy the webhook URL

### 5. Simulate a USSD call
Test the webhook directly with curl:

```bash
# Replace APP_ID with your actual app ID from the dashboard
APP_ID="your-app-id-here"

# Simulate Africa's Talking first dial
curl -X POST http://localhost:8080/ussd/webhook/$APP_ID \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test-session-001&phoneNumber=%2B233244000001&networkCode=62002&serviceCode=%2A714%23&text="

# Should return: CON 1. Check Balance\n2. Buy Airtime\n3. Exit

# Simulate user pressing 1
curl -X POST http://localhost:8080/ussd/webhook/$APP_ID \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test-session-001&phoneNumber=%2B233244000001&networkCode=62002&serviceCode=%2A714%23&text=1"
```

### 6. Check the admin panel
Go to http://localhost:3000/admin → Overview to see session counts

---

## .env.example

```env
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ussd_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (change in production)
JWT_SECRET=local-dev-secret-do-not-use-in-production-change-this

# Paystack (use test keys for local testing)
PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY_HERE
PAYSTACK_PUBLIC_KEY=pk_test_YOUR_KEY_HERE

# Email (optional for local testing — logs emails to console if not set)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=test@localhost.com

# App
APP_BASE_URL=http://localhost:3000
ADMIN_SETUP_SECRET=CHANGE_ME_BEFORE_DEPLOY
```

---

## Common errors

| Error | Fix |
|---|---|
| `Connection refused 5432` | PostgreSQL isn't running. Start it first. |
| `Connection refused 6379` | Redis isn't running. Start it first. |
| `Port 8080 already in use` | Another app is using 8080. Stop it or change `server.port` in application.yml |
| `Flyway migration failed` | Database exists but is dirty. Run: `DROP DATABASE ussd_platform; CREATE DATABASE ussd_platform;` |
| `npm install` fails | Make sure Node 20+ is installed: `node -v` |
| Frontend shows blank page | Check browser console — usually the API URL is wrong in vite.config.js |
