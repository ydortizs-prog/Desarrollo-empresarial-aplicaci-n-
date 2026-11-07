# Transcripción de las comprobaciones HTTP

Servidor: `python manage.py runserver 127.0.0.1:8000`
Cliente externo: `curl.exe` (Windows). Todos los cuerpos se envían como JSON.

## 1. Raíz de la API

```text
$ curl.exe http://127.0.0.1:8000/api/
HTTP 200

{"exams":"http://127.0.0.1:8000/api/exams/",
 "questions":"http://127.0.0.1:8000/api/questions/",
 "choices":"http://127.0.0.1:8000/api/choices/"}
```

## 2. Exámenes

```text
$ curl.exe http://127.0.0.1:8000/api/exams/
HTTP 200
{"count":2,"next":null,"previous":null,"results":[
  {"id":1,"title":"Examen de Django Básico","description":"...","created_at":"...","question_count":6},
  {"id":2,"title":"Examen de Django REST Framework","description":"...","created_at":"...","question_count":6}]}

$ curl.exe -X POST http://127.0.0.1:8000/api/exams/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/exam_create.json"
HTTP 201
{"id":4,"title":"Examen de prueba","description":"Creado desde un cliente HTTP",
 "created_at":"2026-11-07T17:52:10.906242-05:00","question_count":0}

$ curl.exe http://127.0.0.1:8000/api/exams/4/
HTTP 200
{"id":4,"title":"Examen de prueba","description":"Creado desde un cliente HTTP",
 "created_at":"2026-11-07T17:52:10.906242-05:00","question_count":0}

$ curl.exe -X PATCH http://127.0.0.1:8000/api/exams/4/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/exam_patch.json"
HTTP 200
{"id":4,"title":"Examen editado por HTTP","description":"Creado desde un cliente HTTP",...}

$ curl.exe -X DELETE http://127.0.0.1:8000/api/exams/4/
HTTP 204
(cuerpo vacío)

$ curl.exe http://127.0.0.1:8000/api/exams/4/
HTTP 404
{"detail":"No Exam matches the given query."}
```

## 3. Preguntas (opciones anidadas)

```text
$ curl.exe http://127.0.0.1:8000/api/questions/
HTTP 200
{"count":12,"next":"http://127.0.0.1:8000/api/questions/?page=2","previous":null,
 "results":[{"id":1,"exam":1,"text":"¿Qué comando aplica las migraciones pendientes?",
             "score":1,"choices":[{"id":1,"text":"python manage.py migrate","is_correct":true}, ...]}, ...]}

$ curl.exe -X POST http://127.0.0.1:8000/api/questions/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/question_create.json"
HTTP 201
{"id":14,"exam":1,"text":"¿Qué clase de DRF publica un recurso completo?","score":2,
 "choices":[{"id":55,"text":"ModelViewSet","is_correct":true},
            {"id":56,"text":"APIView","is_correct":false},
            {"id":57,"text":"TemplateView","is_correct":false}]}

$ curl.exe http://127.0.0.1:8000/api/questions/14/
HTTP 200
{"id":14,"exam":1,"text":"¿Qué clase de DRF publica un recurso completo?","score":2,"choices":[...]}

$ curl.exe -X PATCH http://127.0.0.1:8000/api/questions/14/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/question_patch.json"
HTTP 200
{"id":14,"exam":1,"text":"¿Qué clase de DRF publica un recurso completo?","score":2,
 "choices":[{"id":59,"text":"Correcta reemplazada","is_correct":true},
            {"id":60,"text":"Incorrecta reemplazada","is_correct":false}]}

$ curl.exe -X DELETE http://127.0.0.1:8000/api/questions/14/
HTTP 204
(cuerpo vacío)
```

## 4. Opciones (recurso suelto)

```text
$ curl.exe http://127.0.0.1:8000/api/choices/
HTTP 200
{"count":48,"next":"http://127.0.0.1:8000/api/choices/?page=2","previous":null,
 "results":[{"id":1,"question":1,"text":"python manage.py migrate","is_correct":true}, ...]}

$ curl.exe -X POST http://127.0.0.1:8000/api/choices/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/choice_create.json"
HTTP 201
{"id":58,"question":1,"text":"Opción suelta","is_correct":false}

$ curl.exe http://127.0.0.1:8000/api/choices/58/
HTTP 200
{"id":58,"question":1,"text":"Opción suelta","is_correct":false}

$ curl.exe -X PATCH http://127.0.0.1:8000/api/choices/58/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/choice_patch.json"
HTTP 200
{"id":58,"question":1,"text":"Opcion editada por HTTP","is_correct":false}

$ curl.exe -X DELETE http://127.0.0.1:8000/api/choices/58/
HTTP 204
(cuerpo vacío)
```

## 5. Errores provocados

```text
$ curl.exe -X POST http://127.0.0.1:8000/api/questions/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/err_missing.json"
HTTP 400
{"text":["Este campo es requerido."]}

$ curl.exe -X POST http://127.0.0.1:8000/api/questions/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/err_type.json"
HTTP 400
{"score":["Introduzca un número entero válido."]}

$ curl.exe -X POST http://127.0.0.1:8000/api/questions/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/err_zero.json"
HTTP 400
{"choices":["Debe haber exactamente una opción correcta."]}

$ curl.exe -X POST http://127.0.0.1:8000/api/questions/ -H "Content-Type: application/json" \
    --data-binary "@docs/http/err_two.json"
HTTP 400
{"choices":["Debe haber exactamente una opción correcta."]}
```

## 6. Filtro, búsqueda y paginación

```text
$ curl.exe "http://127.0.0.1:8000/api/questions/?exam=1"
HTTP 200
count = 6, next = ...?exam=1&page=2, todos los resultados con "exam": 1

$ curl.exe "http://127.0.0.1:8000/api/questions/?search=Django"
HTTP 200
count = 1  (coincide con el enunciado que contiene «Django»)

$ curl.exe "http://127.0.0.1:8000/api/questions/?page=1"
HTTP 200  count = 12, results = 5, next = ...?page=2

$ curl.exe "http://127.0.0.1:8000/api/questions/?page=2"
HTTP 200  count = 12, results = 5, next = ...?page=3

$ curl.exe "http://127.0.0.1:8000/api/questions/?page=3"
HTTP 200  count = 12, results = 2, next = null

$ curl.exe "http://127.0.0.1:8000/api/questions/?page=99"
HTTP 404
{"detail":"Página inválida."}
```

## 7. API navegable

```text
$ curl.exe -H "Accept: text/html" http://127.0.0.1:8000/api/exams/
HTTP 200  Content-Type: text/html; charset=utf-8
La página incluye el formulario HTML de creación y los enlaces a las rutas de detalle.
```
