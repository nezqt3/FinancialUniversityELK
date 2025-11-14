FROM node:22

WORKDIR /app/textbot

COPY backend/textbot/package*.json ./

RUN npm install

COPY backend/textbot ./

COPY backend/textbot/.env ./

EXPOSE 4000

CMD ["node", "main.js"]
