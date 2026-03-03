FROM node:18-bullseye-slim

WORKDIR /app

COPY apps/server/package.json /app/package.json
COPY apps/server/tsconfig.json /app/tsconfig.json
COPY apps/server/tsconfig.build.json /app/tsconfig.build.json
COPY apps/server/nest-cli.json /app/nest-cli.json
COPY apps/server/jest.config.ts /app/jest.config.ts
COPY apps/server/prisma /app/prisma

RUN npm install
RUN npx prisma generate

COPY apps/server/src /app/src
COPY apps/server/test /app/test

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
