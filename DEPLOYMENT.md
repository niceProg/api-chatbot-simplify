# Deployment (Docker)

## 1. Siapkan environment

```bash
cp .env.example .env
```

Isi `GEMINI_API_KEY` di `.env`.

## 2. Setup pertama kali

```bash
./docker.sh --setup
```

## 3. Re-setup (rebuild + recreate)

```bash
./docker.sh --resetup
```

API tersedia di:

- `GET /health`
- `POST /api/chat`

## 4. Bantuan command
```bash
./docker.sh --help
```
