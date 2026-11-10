# syntax=docker/dockerfile:1

# 1) build: instala todas as dependências e compila (webpack gera um único main.js)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY libs ./libs
COPY apps/statement-worker ./apps/statement-worker
RUN npx nest build statement-worker

# 2) deps: só dependências de produção (sem TypeScript, Jest, ESLint...)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# 3) imagem final: Node + dependências de produção + código compilado
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/statement-worker ./dist
# Usuário sem privilégios (já existe na imagem oficial). Os arquivos pertencem
# ao root, então o processo não consegue alterar o próprio código.
USER node
EXPOSE 3002
CMD ["node", "dist/main.js"]
