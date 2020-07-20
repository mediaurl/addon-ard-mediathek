FROM node:12-alpine AS build
WORKDIR /code
COPY package.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node:12-alpine AS deps
WORKDIR /code
COPY package.json ./
RUN npm i --production

FROM node:12-alpine
WORKDIR /code
COPY --from=build /code/dist ./dist/
COPY --from=deps /code/node_modules ./node_modules/
CMD node dist
