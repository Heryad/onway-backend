# Infrastructure Setup - Quick Start Guide

> Start all infrastructure services for OnWay Backend

---

## 🚀 Quick Start

### Step 1: Configure Infrastructure

```bash
cd infrastructure

# Copy environment template
cp .env.example .env

# Edit .env and change all passwords
nano .env  # or use your preferred editor
```

**Important**: Change these passwords:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `TYPESENSE_API_KEY`
- `MINIO_ROOT_PASSWORD`
- `GRAFANA_ADMIN_PASSWORD`
- `PGADMIN_PASSWORD`

### Step 2: Start Services

```bash
# Start all services
docker compose up -d

# Check services are running
docker compose ps

# View logs
docker compose logs -f
```

### Step 3: Verify Services

All services should show status "Up":
- ✅ onway-postgres
- ✅ onway-redis
- ✅ onway-typesense
- ✅ onway-minio
- ✅ onway-prometheus
- ✅ onway-grafana
- ✅ onway-pgadmin
- ✅ onway-redis-commander
- ✅ onway-bullmq-board

---

## 🔗 Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin / (from .env) |
| **pgAdmin** | http://localhost:5050 | admin@onway.com / (from .env) |
| **Redis Commander** | http://localhost:8081 | - |
| **BullMQ Board** | http://localhost:3002 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / (from .env) |
| **Prometheus** | http://localhost:9090 | - |

---

## 🛠️ Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f postgres

# Check service status
docker compose ps

# Remove all data (WARNING!)
docker compose down -v
```

---

## 🔧 Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker info

# Check for port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Database connection issues

```bash
# Check PostgreSQL is ready
docker compose exec postgres pg_isready -U onway_user

# View logs
docker compose logs postgres
```

### Reset everything

```bash
# Stop and remove all data
docker compose down -v

# Start fresh
docker compose up -d
```

---

## 📚 Next Steps

After infrastructure is running:

1. Go back to project root: `cd ..`
2. Configure application: `cp .env.example .env`
3. Update `.env` with same passwords from `infrastructure/.env`
4. Install dependencies: `bun install`
5. Run migrations: `bun run db:migrate`
6. Start API: `bun run dev`

See main [README](../README.md) for complete setup.

---

*Run all commands from the `infrastructure/` directory*
