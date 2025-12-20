# OnWay Backend - Setup Checklist

Follow these steps to get your development environment running.

---

## ✅ Step-by-Step Setup

### 1. Start Infrastructure Services

```bash
# Go to infrastructure folder
cd infrastructure

# Copy environment template
cp .env.example .env

# Edit and change all passwords
nano .env
```

**Change these passwords:**
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `TYPESENSE_API_KEY`
- `MINIO_ROOT_PASSWORD`
- `GRAFANA_ADMIN_PASSWORD`
- `PGADMIN_PASSWORD`

```bash
# Start all Docker services
docker compose up -d

# Verify all services are running
docker compose ps
```

All services should show "Up" status.

---

### 2. Configure Application

```bash
# Go back to project root
cd ..

# Copy application environment
cp .env.example .env

# Generate JWT secrets
openssl rand -base64 64  # Copy output
openssl rand -base64 64  # Copy output

# Edit application .env
nano .env
```

**Update these in .env:**
1. Paste JWT secrets:
   - `JWT_ACCESS_SECRET=<first output>`
   - `JWT_REFRESH_SECRET=<second output>`

2. Match passwords from `infrastructure/.env`:
   - `DATABASE_URL` password = `POSTGRES_PASSWORD`
   - `REDIS_URL` password = `REDIS_PASSWORD`
   - `TYPESENSE_API_KEY` = same value
   - `S3_SECRET_KEY` = `MINIO_ROOT_PASSWORD`

---

### 3. Install Dependencies

```bash
# Install all packages
bun install
```

---

### 4. Setup Database

```bash
# Run migrations to create tables
bun run db:migrate

# (Optional) Seed initial data
bun run db:seed
```

---

### 5. Start Development Server

```bash
# Start the API
bun run dev
```

API will be running at: **http://localhost:3000**

---

## 🔗 Access Your Services

Once everything is running:

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3000 | - |
| **Grafana** | http://localhost:3001 | admin / (from infrastructure/.env) |
| **pgAdmin** | http://localhost:5050 | admin@onway.com / (from infrastructure/.env) |
| **Redis Commander** | http://localhost:8081 | - |
| **BullMQ Board** | http://localhost:3002 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / (from infrastructure/.env) |
| **Prometheus** | http://localhost:9090 | - |

---

## 🧪 Test Your Setup

### Test Database Connection

```bash
# Open Drizzle Studio (database GUI)
bun run db:studio
```

Opens at: http://localhost:4983

### Test API

```bash
# In another terminal
curl http://localhost:3000/health
```

Should return: `{"status":"ok"}`

---

## 🔧 Troubleshooting

### Infrastructure not starting?

```bash
cd infrastructure
docker compose logs
```

### Can't connect to database?

1. Check PostgreSQL is running:
   ```bash
   cd infrastructure
   docker compose ps postgres
   ```

2. Verify password matches:
   ```bash
   # Check infrastructure/.env
   grep POSTGRES_PASSWORD infrastructure/.env
   
   # Check .env (root)
   grep DATABASE_URL .env
   ```

### Port already in use?

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or change PORT in .env
```

---

## 📚 Next Steps

Once everything is running:

1. ✅ Explore pgAdmin to see your database tables
2. ✅ Check Grafana dashboards for monitoring
3. ✅ Review database schema in Drizzle Studio
4. ✅ Start building API endpoints

---

## 🛑 Stopping Everything

```bash
# Stop API
Ctrl+C in the terminal running `bun run dev`

# Stop infrastructure
cd infrastructure
docker compose down
```

---

*For detailed information, see [README.md](./README.md)*
