<div align="center">
  <h1>🏋️ HeavyLift Backend</h1>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
    <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
    <img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />
  </p>

  <p>
    <strong>Backend REST API untuk sistem manajemen gym (HeavyLift)</strong><br />
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" />
    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" />
  </p>
</div>

---

## 🌟 Overview

**HeavyLift** adalah backend REST API untuk sistem manajemen gym — mencakup autentikasi member/owner, manajemen paket keanggotaan, pembayaran online (Xendit), absensi, manajemen trainer & alat gym, review, hingga pengumuman. Dibangun dengan **NestJS**, **Prisma ORM**, **PostgreSQL** sebagai database utama, dan **Redis** untuk session/refresh token management.

Project ini sepenuhnya **dockerized** dan sudah memiliki **CI/CD** (GitHub Actions) yang otomatis build & push image ke **GitHub Container Registry (GHCR)** setiap ada perubahan ke branch `main`.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi JWT** — access & refresh token, mendukung multi-device session (satu user bisa login di beberapa device bersamaan), lengkap dengan **refresh token reuse detection** (revoke semua sesi otomatis kalau ada indikasi token dicuri)
- 👤 **Manajemen Member** — registrasi, profile, upload foto, soft-delete
- 📦 **Manajemen Paket & Kategori** — CRUD paket keanggotaan gym
- 💳 **Payment Gateway (Xendit)** — pembuatan invoice otomatis, webhook untuk status `PAID`/`EXPIRED`, dibungkus transaksi database untuk konsistensi
- 🏃 **Absensi (Check-in/Check-out)** — simulasi QR, riwayat, status sesi aktif
- 🏋️ **Manajemen Trainer & Equipment** — termasuk upload foto alat
- ⭐ **Review & Rating** — dengan mekanisme publish/unpublish
- 📢 **Pengumuman (Announcements)** — manual maupun otomatis
- 🛡️ **Keamanan** — rate limiting (`@nestjs/throttler`), `helmet()`, CORS dibatasi origin tertentu, validasi environment variable saat startup (Joi)
- 🪵 **Logging terstruktur** — JSON di production, pretty-print di development (`nestjs-pino`)
- 📝 **Swagger/OpenAPI Documentation** otomatis via `@nestjs/swagger`
- ✅ **147 unit test** (Jest, level Service)

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Cache / Session | Redis |
| Payment Gateway | Xendit |
| Auth | JWT (access + refresh token) |
| Dokumentasi API | Swagger / OpenAPI |
| Logging | Pino (`nestjs-pino`) |
| Testing | Jest |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → GHCR |

---

## 📋 Daftar Isi

1. [Environment Configuration](#️-environment-configuration)
2. [Cara Menjalankan Aplikasi](#-cara-menjalankan-aplikasi)
   - [Mode A — Manual (Lokal, tanpa Docker)](#mode-a--manual-lokal-tanpa-docker)
   - [Mode B — Docker Development](#mode-b--docker-development)
   - [Mode C — Docker Production (Lokal)](#mode-c--docker-production-lokal)
3. [Project Structure](#-project-structure)
4. [API Documentation](#-api-documentation)
5. [Daftar Endpoint](#-daftar-endpoint)
6. [Testing](#-testing)
7. [CI/CD](#-cicd)
8. [Troubleshooting](#️-troubleshooting)

---

## ⚙️ Environment Configuration

Copy `.env.example` menjadi `.env`, lalu isi semua value:

```bash
cp .env.example .env
```

| Variabel | Deskripsi |
|---|---|
| `NODE_ENV` | `development` atau `production`. **Untuk Docker, nilai ini di-inject dari `docker-compose.yml`/`docker-compose.dev.yml`, bukan dari `.env` — lihat catatan penting di bawah** |
| `PORT` | Port aplikasi (default `3000`) |
| `CORS_ORIGIN` | Origin frontend yang diizinkan mengakses API |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Kredensial database PostgreSQL |
| `POSTGRES_PORT` / `REDIS_PORT` | Port yang di-expose ke host **khusus untuk development** (untuk debugging manual via DBeaver/pgAdmin/redis-cli) |
| `DATABASE_URL` / `DIRECT_URL` | Connection string Prisma ke PostgreSQL |
| `REDIS_URL` | Connection string ke Redis |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secret key untuk access & refresh token |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Masa berlaku token |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | Kredensial akun owner yang dibuat oleh seeder |
| `XENDIT_SECRET_KEY` / `XENDIT_CALLBACK_TOKEN` | Kredensial Xendit (gunakan TEST key untuk development) |

> ⚠️ **Penting soal `NODE_ENV`:** nilai `NODE_ENV` di dalam `.env` **tidak** menentukan mode aplikasi ketika dijalankan lewat Docker. `docker-compose.yml` (production) dan `docker-compose.dev.yml` (development) masing-masing sudah menetapkan `NODE_ENV` secara eksplisit lewat `environment:`, yang selalu menang dibanding isi `.env`. Ini disengaja — supaya production selalu jalan sebagai `production` dan development selalu `development`, apa pun isi `.env` di komputer kamu.

---

## 🚀 Cara Menjalankan Aplikasi

> ⚠️ **PENTING — Pilih SATU mode saja.** Ketiga mode di bawah memakai port host yang sama (`3000`, `5432`, `6379` secara default). Menjalankan lebih dari satu mode secara bersamaan tanpa mengubah `PORT` di `.env` akan menyebabkan error `port is already allocated`. Jika mode lain masih berjalan, matikan dulu sebelum berpindah mode (lihat perintah `down` di tiap mode).

### Mode A — Manual (Lokal, tanpa Docker)

Cocok jika kamu sudah punya PostgreSQL & Redis terinstall/jalan secara lokal.

**Prerequisites:** Node.js (LTS), PostgreSQL, Redis — semua berjalan di host, bukan Docker.

```bash
git clone https://github.com/WahyuPratama222/heavylift-backend.git
cd heavylift-backend
cp .env.example .env   # isi DATABASE_URL, REDIS_URL, dll mengarah ke instance lokal kamu

npm install
npx prisma generate
npx prisma migrate dev

# Isi data awal (pilih salah satu):
npm run seed:prod   # data essential saja (akun owner, dll)
npm run seed:dev    # data essential + data dummy

npm run start:dev
```

Aplikasi berjalan di `http://localhost:3000`.

---

### Mode B — Docker Development

Menjalankan aplikasi + PostgreSQL + Redis semuanya di dalam container, dengan hot-reload untuk development.

**Prerequisites:** Docker & Docker Compose.

```bash
git clone https://github.com/WahyuPratama222/heavylift-backend.git
cd heavylift-backend
cp .env.example .env   # isi value, hostname DB/Redis cukup "postgres" dan "redis" (nama service)

docker compose -f docker-compose.dev.yml up -d --build
```

Jalankan migration & seeder di dalam container:

```bash
docker exec -it heavylift-app-dev npx prisma migrate dev
docker exec -it heavylift-app-dev npm run seed:dev
```

Aplikasi berjalan di `http://localhost:3000`. Untuk mematikan:

```bash
docker compose -f docker-compose.dev.yml down
```

---

### Mode C — Docker Production (Lokal)

Menjalankan **image production** yang sudah dibangun oleh CI/CD dan tersedia di GHCR — cara ini untuk mencoba/memverifikasi image production secara lokal, **bukan** instruksi deploy ke server (project ini belum di-deploy ke server manapun).

**Prerequisites:** Docker & Docker Compose.

```bash
git clone https://github.com/WahyuPratama222/heavylift-backend.git
cd heavylift-backend
cp .env.example .env   # isi value

docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
```

Jalankan migration & seeder (dilakukan manual/terpisah — **tidak** otomatis berjalan saat container start):

```bash
docker exec -it heavylift-app npx prisma migrate deploy
docker exec -it heavylift-app npm run seed:prod
```

Aplikasi berjalan di `http://localhost:3000`. Untuk mematikan:

```bash
docker compose -f docker-compose.yml down
```

---

## 📁 Project Structure

```
heavylift-backend/
├── .github/workflows/       # CI/CD (GitHub Actions)
├── prisma/
│   ├── schema.prisma         # Definisi model & datasource
│   ├── seed.ts                # Seeder data essential (owner, dll)
│   ├── seed-dummy.ts          # Seeder data dummy
│   ├── seeders/                # Helper seeder
│   └── migrations/             # Riwayat migrasi database
├── src/
│   ├── common/                 # Decorator, helper, filter, interceptor, DTO reusable
│   ├── config/                  # Validasi environment variable (Joi)
│   ├── auth/                    # Autentikasi (JWT, refresh token)
│   ├── members/
│   ├── package-categories/
│   ├── packages/
│   ├── member-packages/
│   ├── payments/                # Integrasi Xendit + webhook
│   ├── attendances/
│   ├── equipments/
│   ├── trainers/
│   ├── reviews/
│   ├── announcements/
│   ├── gym/                      # Settings & schedules
│   ├── health/
│   ├── app.module.ts
│   └── main.ts                    # Entry point (pipe, prefix, swagger, helmet)
├── test/
├── Dockerfile                      # Production image (multi-stage)
├── Dockerfile.dev                  # Development image (hot-reload)
├── docker-compose.yml               # Production (pull image dari GHCR)
├── docker-compose.dev.yml           # Development (build lokal)
└── .env.example
```

---

## 📖 API Documentation

Setelah aplikasi berjalan (mode mana pun), dokumentasi interaktif Swagger tersedia di:

👉 **`http://localhost:3000/api/docs`**

Semua endpoint yang butuh autentikasi/role sudah didokumentasikan lengkap dengan requirement Bearer token dan role (`Member`/`Owner`) di Swagger UI.

---

## 🔌 Daftar Endpoint

> Semua endpoint di bawah menggunakan prefix **`/api`** (contoh: `/auth/login` berarti `/api/auth/login`). Untuk detail request/response body, gunakan Swagger di atas.

### Auth

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/auth/register` | Public | Register member baru |
| POST | `/auth/login` | Public | Login, return JWT token |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Member / Owner | Logout, revoke refresh token |

### Members

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/members/profile` | Member | Lihat profile sendiri |
| PATCH | `/members/profile` | Member | Update profile sendiri |
| PUT | `/members/profile/photo` | Member | Update foto profile |
| GET | `/members` | Owner | List semua member + filter |
| GET | `/members/:id` | Owner | Detail 1 member |
| DELETE | `/members/:id` | Owner | Soft delete member |

### Package Categories

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/package-categories` | Owner | Tambah kategori paket |
| GET | `/package-categories` | Public | List semua kategori paket |
| GET | `/package-categories/:id` | Public | Detail 1 kategori paket |
| PATCH | `/package-categories/:id` | Owner | Update kategori paket |
| DELETE | `/package-categories/:id` | Owner | Hapus kategori paket |

### Packages

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/packages` | Owner | Tambah paket |
| GET | `/packages` | Public | List paket aktif + filter |
| GET | `/packages/:id` | Public | Detail 1 paket |
| PATCH | `/packages/:id` | Owner | Update paket |
| DELETE | `/packages/:id` | Owner | Hapus paket |

### Member Packages

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/member-packages` | Member | Beli paket |
| GET | `/member-packages/my` | Member | History paket sendiri |
| GET | `/member-packages` | Owner | List semua transaksi paket |

### Payments

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/payments/webhook` | Public | Callback dari Xendit |
| GET | `/payments` | Owner | List semua pembayaran |
| GET | `/payments/:id` | Owner | Detail 1 pembayaran |

### Attendances

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/attendances/check-in` | Member | Check in (simulasi QR) |
| POST | `/attendances/check-out` | Member | Check out |
| GET | `/attendances/my` | Member | History absensi sendiri |
| GET | `/attendances/status` | Member | Cek sesi aktif member saat ini |
| GET | `/attendances` | Owner | List semua absensi |

### Equipments

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/equipments` | Owner | Tambah alat |
| GET | `/equipments` | Public | List alat |
| GET | `/equipments/:id` | Public | Detail alat + foto |
| PATCH | `/equipments/:id` | Owner | Update alat |
| DELETE | `/equipments/:id` | Owner | Hapus alat |
| POST | `/equipments/:id/photos` | Owner | Tambah foto alat (batch) |
| DELETE | `/equipments/:id/photos/:photoId` | Owner | Hapus foto alat |

### Reviews

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/reviews` | Member | Submit review |
| GET | `/reviews` | Public | List review yang published |
| PATCH | `/reviews/:id/publish` | Owner | Publish/unpublish review |

### Announcements

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/announcements` | Owner | Buat announcement manual |
| GET | `/announcements` | Member | List announcement aktif |
| PATCH | `/announcements/:id` | Owner | Update announcement |
| DELETE | `/announcements/:id` | Owner | Hapus announcement |

### Gym

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/gym/settings` | Public | Info gym |
| PATCH | `/gym/settings` | Owner | Update info gym |
| GET | `/gym/schedules` | Public | Jadwal buka gym |
| PATCH | `/gym/schedules/:day` | Owner | Update jadwal buka gym |

### Trainers

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/trainers` | Owner | Tambah trainer |
| GET | `/trainers` | Public | List trainer |
| PATCH | `/trainers/:id` | Owner | Update trainer |
| DELETE | `/trainers/:id` | Owner | Hapus trainer |

### Health

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/health` | Public | Health check (Database & Redis) |

---

## 🧪 Testing

```bash
npm run test
```

Terdapat **147 unit test** (Jest) di level Service, mencakup 14 module inti. Controller & Module tidak di-unit-test secara terpisah karena tidak memiliki branching logic — dicover lewat E2E test (belum diimplementasi).

---

## ⚡ CI/CD

Setiap push/merge ke branch `main` (serta tag `v*`), GitHub Actions otomatis:

1. Install dependencies, `prisma generate`, build, dan menjalankan seluruh unit test
2. Jika lolos, build Docker image dan push ke **GitHub Container Registry (GHCR)**

Pull request ke `main` hanya menjalankan validasi (test + build image), **tidak** melakukan push image — image resmi (tag `latest`) hanya dihasilkan dari `main`.

Image terbaru dapat ditarik dengan:

```bash
docker pull ghcr.io/wahyupratama222/heavylift-backend:latest
```

---

## 🛠️ Troubleshooting

### Problem: `Error: Cannot find module '/app/dist/main'` saat container production start

**Penyebab:** Folder `prisma/` (berisi `seed.ts`, `seed-dummy.ts`) ikut ter-compile oleh `nest build` karena tidak di-exclude di `tsconfig.build.json`. Akibatnya TypeScript menentukan "common root" naik ke level project (bukan `src/` saja), sehingga output menjadi nested (`dist/src/main.js`), bukan `dist/main.js` seperti yang diharapkan `CMD` di `Dockerfile`.

**Solusi:** pastikan folder `prisma` masuk ke `exclude` pada `tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "prisma", "**/*spec.ts"]
}
```

### Problem: `Error: unable to determine transport target for "pino-pretty"` saat container production start

**Penyebab:** `NODE_ENV` di `.env` masih bernilai `development`, sedangkan `pino-pretty` (dibutuhkan untuk pretty-print log saat development) sengaja tidak ikut ke image production (`npm prune --production` membuang devDependencies).

**Solusi:** jangan andalkan `.env` untuk `NODE_ENV` saat menjalankan lewat Docker. Set eksplisit lewat `environment:` di compose file (`docker-compose.yml` untuk production, `docker-compose.dev.yml` untuk development) — ini akan selalu menang dibanding isi `.env`.

### Problem: `PrismaClientInitializationError: ... could not locate the Query Engine for runtime "linux-musl"`

**Penyebab:** `openssl` hanya diinstall di stage `builder` pada `Dockerfile`, tidak ikut di stage `production`. Prisma Client di-generate dengan asumsi ada openssl, tapi saat runtime di stage production openssl tidak ditemukan.

**Solusi:** tambahkan `RUN apk update && apk add --no-cache openssl libc6-compat` di **kedua** stage (`builder` maupun `production`) pada `Dockerfile`.

### Problem: Container dari `docker-compose.yml` dan `docker-compose.dev.yml` saling "Recreated" / tertukar nama

**Penyebab:** kedua compose file memakai nama service yang sama (`app`, `postgres`, `redis`) dan dijalankan dari folder yang sama, sehingga Docker Compose menganggap keduanya adalah project yang sama (nama project default diambil dari nama folder).

**Solusi:** tambahkan `name:` eksplisit dan berbeda di masing-masing compose file:
```yaml
# docker-compose.yml
name: heavylift-backend

# docker-compose.dev.yml
name: heavylift-backend-dev
```

### Problem: `port is already allocated` saat menjalankan dua mode Docker bersamaan

**Penyebab:** `docker-compose.yml` dan `docker-compose.dev.yml` sama-sama default ke port `3000`/`5432`/`6379` di host.

**Solusi:** jalankan satu mode saja (matikan salah satu dengan `docker compose down` sebelum berpindah), atau override port host untuk salah satunya:
```bash
PORT=3001 docker compose -f docker-compose.dev.yml up -d
```

---

<div align="center">
  <sub>Dibuat dan dikembangkan oleh <strong>Wahyu Pratama</strong></sub>

  <br /><br />

  <a href="https://github.com/WahyuPratama222"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/wahyu-pratama-ptm"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=wahyupratama110107@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" /></a>
</div>
