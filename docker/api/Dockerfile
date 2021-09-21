###
FROM node:15-alpine as osher-api-builder

WORKDIR /build

RUN apk update \
    && apk upgrade \
    && apk --no-cache add \
        ca-certificates \
        wget \
        curl \
        git

COPY api/yarn.lock /build/yarn.lock
COPY api/package.json /build/package.json

RUN yarn install

COPY api/tsconfig.json /build/tsconfig.json
COPY api/src /build/src
COPY api/config /build/config

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

COPY api/package.json /var/www/package.json
COPY api/yarn.lock /var/www/yarn.lock
COPY api/config /var/www/config
COPY --from=osher-api-builder /build/dist /var/www/dist
COPY docker/api/app.sh /usr/local/bin/

EXPOSE 7000

CMD ["app.sh"]
