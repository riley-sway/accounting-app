FROM node:20

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

ENV DATABASE_URL="file:/tmp/build.db"
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
