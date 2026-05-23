FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN addgroup -S bot && adduser -S bot -G bot && \
    mkdir -p /app/data && chown -R bot:bot /app

USER bot

CMD ["node", "index.js"]
