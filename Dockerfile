FROM node:23-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y wget

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x ./bin/www

ENV NODE_ENV=production

ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["npm", "start"]
