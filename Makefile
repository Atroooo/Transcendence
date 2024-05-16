.PHONY: all build rebuild stop stop volumes fclean down

all: build up

build:
		docker-compose -f docker-compose.yml --env-file .env build

up:
		docker-compose -f docker-compose.yml --env-file .env up -d

stop:
		docker-compose -f docker-compose.yml --env-file .env stop

fclean:
		docker-compose -f docker-compose.yml --env-file .env down -v --rmi all --remove-orphans

down:
		docker-compose -f docker-compose.yml --env-file .env down

rebuild:
		docker-compose -f docker-compose.yml --env-file .env build --no-cache

re: fclean rebuild all