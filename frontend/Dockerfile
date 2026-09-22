FROM node:18-alpine

WORKDIR /app

# Копируем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Запускаем dev-сервер
CMD ["npm", "start"]
