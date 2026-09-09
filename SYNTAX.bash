docker exec -it heavylift-app-dev

# Remove Semua Service
docker compose -f docker-compose.dev.yml down -v --remove-orphans

# Build Service dari Awal
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml up -d --build

# 
docker compose -f docker-compose.dev.yml stop
docker compose -f docker-compose.dev.yml start

docker compose -f docker-compose.dev.yml logs postgres --tail=20

docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build -d

docker exec -it heavylift-app-dev npx prisma migrate dev
docker exec -it heavylift-app-dev npx prisma generate

docker exec -it heavylift-app-dev npx prisma db seed

