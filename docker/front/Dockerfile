###
FROM node:15-alpine as osher-front-builder

WORKDIR /build

RUN apk update \
    && apk upgrade \
    && apk --no-cache add \
        ca-certificates \
        wget \
        curl \
        git

COPY front/package.json /build/package.json
COPY front/yarn.lock /build/yarn.lock

RUN yarn install

COPY front/public /build/public
COPY front/src /build/src
COPY front/index.html /build/index.html
COPY front/tsconfig.json /build/tsconfig.json
COPY front/vite.config.ts /build/vite.config.ts
COPY front/.env /build/.env

RUN yarn build:server
RUN yarn build

###
FROM node:15-alpine

WORKDIR /var/www

RUN apk update \
    && apk upgrade \
    && apk --no-cache add \
        tzdata \
        ca-certificates \
        wget \
        curl \
        git

COPY front/package.json /var/www/package.json
COPY front/yarn.lock /var/www/yarn.lock
COPY --from=osher-front-builder /build/dist /var/www/dist
COPY docker/front/app.sh /usr/local/bin/

EXPOSE 3000

CMD ["app.sh"]
