# OnWay Backend

> High-performance e-commerce delivery platform built with Bun, HonoJS, PostgreSQL, and modern infrastructure

---

## 🚀 Tech Stack

- **Runtime**: Bun
- **Framework**: HonoJS
- **Database**: PostgreSQL 16 + PostGIS
- **ORM**: Drizzle ORM
- **Cache**: Redis 7
- **Search**: Typesense
- **Jobs**: BullMQ
- **Realtime**: Socket.IO
- **Storage**: MinIO (S3-compatible)
- **Validation**: Zod
- **Auth**: Argon2 + OAuth (Google, Apple, Facebook)
- **Monitoring**: Prometheus + Grafana

---

## 📁 Project Structure

```
onway-backend/
├── infrastructure/            # 🐳 Docker services
│   ├── docker-compose.yml    # All infrastructure
│   ├── .env.example          # Infrastructure config
│   └── README.md             # Quick start
│
├── src/                       # 💻 API source code
│   └── db/schema/            # 48 database tables
│
├── .env.example              # Application config
├── DATABASE_DOCUMENTATION.md # Database features guide
└── README.md                 # This file
```

---

## 🎯 Quick Start

### Prerequisites

- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Bun** - Install: `curl -fsSL https://bun.sh/install | bash`

### Step 1: Start Infrastructure

```bash
# Go to infrastructure folder
cd infrastructure

# Copy and configure environment
cp .env.example .env
nano .env  # Change all passwords!

# Start all services
docker compose up -d

# Verify services are running
docker compose ps
```

See [infrastructure/README.md](./infrastructure/README.md) for details.

### Step 2: Configure Application

```bash
# Back to project root
cd ..

# Copy application environment
cp .env.example .env

# Generate JWT secrets
openssl rand -base64 64  # Copy for JWT_ACCESS_SECRET
openssl rand -base64 64  # Copy for JWT_REFRESH_SECRET

# Edit .env
nano .env
```

**Important**: Make sure passwords in `.env` match `infrastructure/.env`:
- `DATABASE_URL` password = `POSTGRES_PASSWORD`
- `REDIS_URL` password = `REDIS_PASSWORD`
- `TYPESENSE_API_KEY` = same in both
- `S3_SECRET_KEY` = `MINIO_ROOT_PASSWORD`

### Step 3: Install & Run

```bash
# Install dependencies
bun install

# Run database migrations
bun run db:migrate

# Seed initial data (optional)
bun run db:seed

# Start development server
bun run dev
```

API will be available at: **http://localhost:3000**

---

## 🔗 Service URLs

### Application
- **API**: http://localhost:3000

### Management Dashboards
- **Grafana**: http://localhost:3001
- **pgAdmin**: http://localhost:5050
- **Redis Commander**: http://localhost:8081
- **BullMQ Board**: http://localhost:3002
- **MinIO Console**: http://localhost:9001
- **Prometheus**: http://localhost:9090

---

## 📝 Environment Files

### Two Separate Files

1. **`infrastructure/.env`** - Docker services configuration
   - PostgreSQL password
   - Redis password
   - Typesense API key
   - MinIO credentials
   - Grafana/pgAdmin passwords

2. **`.env`** (project root) - Application configuration
   - Database URL (uses password from infrastructure/.env)
   - Redis URL (uses password from infrastructure/.env)
   - JWT secrets
   - OAuth credentials
   - Email/SMS providers

**Important**: Passwords must match between both files!

---

## 🛠️ Available Scripts

```bash
# Development
bun run dev              # Start dev server

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:seed          # Seed data
bun run db:studio        # Open Drizzle Studio

# Production
bun run build            # Build
bun run start            # Start production

# Testing
bun test                 # Run tests
bun test:watch           # Watch mode

# Code Quality
bun run lint             # Lint
bun run format           # Format
bun run typecheck        # Type check
```

---

## 🗄️ Database

48 tables organized into:
- Core (Countries, Cities, Zones)
- Users (Customers, OAuth, Sessions, Addresses)
- Stores (Stores, Products, Categories, Addons)
- Orders (Orders, Items, Status History)
- Delivery (Drivers, Assignments, Earnings)
- Payments (Transactions, Refunds)
- Marketing (Promos, Campaigns, Banners)
- Support (Tickets, Messages, Reviews)
- Social (Stories, Groups, Chat, Notifications)

See [DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md) for details.

---

## 🐳 Infrastructure Services

| Service | Purpose | Port |
|---------|---------|------|
| PostgreSQL | Database | 5432 |
| Redis | Cache | 6379 |
| Typesense | Search | 8108 |
| MinIO | Storage | 9000, 9001 |
| Prometheus | Metrics | 9090 |
| Grafana | Dashboards | 3001 |
| pgAdmin | DB GUI | 5050 |
| Redis Commander | Redis GUI | 8081 |
| BullMQ Board | Jobs GUI | 3002 |

---

## 🔧 Troubleshooting

### Infrastructure Issues

```bash
cd infrastructure
docker compose logs SERVICE_NAME
```

See [infrastructure/README.md](./infrastructure/README.md#troubleshooting)

### Application Issues

```bash
# Check environment variables
cat .env | grep -v "^#" | grep -v "^$"

# Verify database connection
bun run db:studio
```

### Common Problems

**"Connection refused" errors**
- Check infrastructure is running: `cd infrastructure && docker compose ps`
- Verify passwords match in both .env files

**"Port already in use"**
- Check what's using the port: `lsof -i :3000`
- Change PORT in .env

---

## 📚 Documentation

- **[Admin API](./ADMIN_API.md)** - Admin authentication & management endpoints
- **[Infrastructure Setup](./infrastructure/README.md)** - Docker quick start
- **[Database Guide](./DATABASE_DOCUMENTATION.md)** - All features explained

---

## 🚀 Deployment

Production checklist:
- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Configure OAuth providers
- [ ] Set up SSL/TLS
- [ ] Configure firewall
- [ ] Set up automated backups
- [ ] Enable monitoring alerts
- [ ] Review resource limits

---

## 📝 License

Proprietary - All rights reserved

---

*For detailed setup, see [infrastructure/README.md](./infrastructure/README.md)*
