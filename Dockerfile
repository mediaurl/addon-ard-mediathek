FROM node:14-alpine AS build
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:14-alpine AS deps
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci --production
RUN ls -l
RUN version=$(node -e "console.log(require('./package').dependencies['@mediaurl/sdk'])") &&     npm i @mediaurl/sql-cache@$version @mediaurl/cassandra-cache@$version

FROM node:14-alpine
WORKDIR /code
ENV LOAD_MEDIAURL_CACHE_MODULE "@mediaurl/sql-cache @mediaurl/cassandra-cache"
COPY --from=build /code/dist ./dist/
COPY --from=deps /code/node_modules ./node_modules/
CMD node dist
