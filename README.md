## Что это?

Это сервис по продаже билетов на мероприятия.

Предполагалось прикрутить сюда еще более-менее дизайн (заказать) и дать рекламу в инсте, на хотя бы одно мероприятие.
Участвовал в проекте, как партнер, но это все не пошло по нескольким причинам. Поэтому могу выложить код в паблик. Весь код мой.

Сделан на nodejs, typescript, vue 3

Есть api, есть front (c ssr и 404 страницей для seo), есть admin, есть девопс в docker swarm, тестов нет, линтера нет, претиера нет, думал прикрутить позже.

Вообще, это скорее proof-of-concept (даже не mvp) и подбор стека под меня лично, чтобы я мог это все поддерживать и передать на разработку при расширении.
Здесь есть косяки, в частности организацию моделек так делать не надо. Однако есть интересная штука - это объявление DTO через TypeGuards

Вместо вебсокетов мне показалось интереснее слелать sse, т.к. тут проще отслеживать обрыв связи и делать реконнект.

Вообще, такой стек мне нравится и в других пет-проджектах я его использую и дорабатываю. В планах сделать деплой (как минимум рендера) на серверлесс платформы. Сейчас думаю про cloudflare. Для ноды есть готовые решения вроде vitessedge (рендер vite-приложения на cloudflare), однако не совсем лично меня устраивает.

Деплой - на вдску, ниже инструкция, как я это делал и соответственно можно глянуть сам шелл-скрипт.

## Инструкция по devops:

1. Убедиться, что включен docker swarm
```sh
docker swarm init
```

2. Первый раз получить сертификаты для прокси, чтобы смог запуститься nginx
```sh
./devops init-certbot
```
Нужно ввести пароль sudo.
Если нужно добавить доменов, то нужно исправить функцию init_certbot в devops
и снова запустить инициализацию

3. Последовательно задеплоить сервисы
```sh
./devops deploy proxy
./devops deploy api
./devops deploy front
./devops deploy admin
```

4. Проверить, что всё работает
```sh
docker service ls
docker service logs osh_proxy -f
docker service logs osh_api -f
docker service logs osh_front -f
docker service logs osh_admin -f
docker ps -a
```
