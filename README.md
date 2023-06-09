# Проект веб приложения для суммаризации текста из файла размером до 1 МБ

## Курсовая работа (DOCX)

Файлы курсовой работы находятся в папке `documentation`

## Преднастройки

Если целевая система `Linux`, то необходимо определить переменную UID в файле `.env`. Пример \
`UID=1000` \
Вместо *1000* подставить результат команды \
`echo $UID`

Проверить свободность портов:

- 5432
- 2181
- 9093
- 9092
- 5000
- 5001
- 5002

## Запуск проекта

```commandline
docker-compose up
```

## Информация по запущенному проекту

### Frontend

[UI приложения](http://localhost:5001/)

Лог запуска
```
Project is running at
```

### Backend

Документация по API находится в [swagger.yaml](./documentation/swagger.yaml)

Лог запуска

```
text_summarizing.AppKt                   : Started AppKt in \d{2}.\d{3} seconds (process running for \d{2}.\d{3})
```

### kafka + zookeper

Лог запуска (в kafka)

```
INFO [KafkaServer id=\d+] started (kafka.server.KafkaServer)
```

### postgresql

Лог запуска

```
PostgreSQL init process complete; ready for start up.
```

### text_summarize

Лог запуска

```
Application started
```


## Требования для разработки

- Docker 
- NodeJS 20
- Chrome
- Java 20
- Kotlin 1.8
- mvn 3.9
- python 3.10

## Сборка проекта

Для сборки проекта создан `docker-compose_builder.yml`, который позволяет собрать в более компактный формат:

- Фронтенд
- Бэкенд

Собрать всё разом можно командой 

```docker-compose -f docker-compose_builder.yml up```

## Запуск production (собранной) версии приложeния

1. Собрать приложение следуя пункту "Сборка проекта"
2. Выполнить команду

```commandline
docker-compose -f docker-compose_production.yml up
```

