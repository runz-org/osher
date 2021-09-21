###
FROM node:15-alpine as osher-admin-builder

WORKDIR /build

RUN apk update \
    && apk upgrade \
    && apk --no-cache add \
        ca-certificates \
        wget \
        curl \
        git

COPY admin/package.json /build/package.json
COPY admin/yarn.lock /build/yarn.lock

RUN yarn install

COPY admin/public /build/public
COPY admin/src /build/src
COPY admin/index.html /build/index.html
COPY admin/tsconfig.json /build/tsconfig.json
COPY admin/vite.config.ts /build/vite.config.ts
COPY admin/.env /build/.env

RUN yarn build

###
FROM nginx:stable-alpine

COPY --from=osher-admin-builder /build/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
