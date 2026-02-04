# Deployment (Docker)

## 1. Siapkan environment

```bash
cp .env.example .env
```

Isi `GEMINI_API_KEY` di `.env`.

## 2. Build image

```bash
./scripts/docker-build.sh
```

## 3. Jalankan container

```bash
./scripts/docker-up.sh
```

API tersedia di:

- `GET /health`
- `POST /api/chat`

## 4. Stop container

```bash
./scripts/docker-down.sh
```

## 5. Lihat logs realtime

```bash
./scripts/docker-logs.sh
```
