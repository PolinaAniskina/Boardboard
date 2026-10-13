FROM node:20-alpine

WORKDIR /app

# Копируем только манифесты, чтобы кэшировать npm install
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальной код
COPY . .

# CRA на порту 3000 внутри контейнера
EXPOSE 3000

# Для HMR (hot reload) внутри Docker
ENV CHOKIDAR_USEPOLLING=true

# Запускаем dev-сервер
CMD ["npm", "start"]