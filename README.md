# Проект веб приложения для суммаризации текста

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

Документация по API находится в [swagger.yaml](swagger.yaml)

Лог запуска

```
text_summarizing.AppKt                   : Started AppKt in \d{2}.\d{3} seconds (process running for \d{2}.\d{3})
```

### Documentation

PDF курсовой работы по [ссылке](http://localhost:5002/course_work.pdf) или в [файле](./documentation/out/course_work.pdf)

Лог запуска

```
Compiled
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