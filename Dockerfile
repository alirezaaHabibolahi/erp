FROM node:22-bookworm AS build

WORKDIR /app

ENV HUSKY=0

COPY package.json yarn.lock ./
# Remove --frozen-lockfile
RUN corepack enable && yarn install

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY libs ./libs
RUN yarn build


FROM node:22-bookworm AS production-dependencies

WORKDIR /app
ENV NODE_ENV=production \
    HUSKY=0

COPY package.json yarn.lock ./
# Remove --frozen-lockfile
RUN corepack enable && yarn install --production=true

# Or if you want to keep the lockfile check but with update
# RUN corepack enable && yarn install --production=true --frozen-lockfile


FROM node:22-bookworm AS production

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

RUN mkdir -p /app/downloads && chown node:node /app/downloads

USER node

EXPOSE 3000
VOLUME ["/app/downloads"]


HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/', (response) => process.exit(response.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main"]