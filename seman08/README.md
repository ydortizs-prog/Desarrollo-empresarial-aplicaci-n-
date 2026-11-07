# Lab S08 — API con Django REST Framework

API de cuestionarios construida sobre el proyecto `quiz` del curso. Expone tres recursos
—**exámenes**, **preguntas** y **opciones**— mediante `ModelViewSet` y un `DefaultRouter`
de Django REST Framework, con serializadores que validan el caso del negocio: cada
pregunta viaja con sus opciones anidadas y debe tener **exactamente una** opción correcta.

## Requisitos

- Python 3.12 o superior (probado con 3.14)
- Las dependencias de `requirements.txt`

## Puesta en marcha

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_quiz   # 2 exámenes, 12 preguntas, 48 opciones
.\venv\Scripts\python.exe manage.py runserver
```

La API queda en <http://127.0.0.1:8000/api/> y la API navegable en la misma dirección
desde el navegador. Las páginas web del cuestionario siguen en <http://127.0.0.1:8000/>.

## Recursos

| Recurso | Colección | Detalle |
|---|---|---|
| Exámenes | `GET/POST /api/exams/` | `GET/PUT/PATCH/DELETE /api/exams/{id}/` |
| Preguntas | `GET/POST /api/questions/` | `GET/PUT/PATCH/DELETE /api/questions/{id}/` |
| Opciones | `GET/POST /api/choices/` | `GET/PUT/PATCH/DELETE /api/choices/{id}/` |

Parámetros de las preguntas:

- `?exam=<id>` filtra por examen.
- `?search=<texto>` busca en el enunciado.
- `?page=<n>` pagina los resultados (5 por página).

## Ejemplos

```powershell
# Listar exámenes
curl.exe http://127.0.0.1:8000/api/exams/

# Crear una pregunta con sus opciones anidadas
curl.exe -X POST http://127.0.0.1:8000/api/questions/ `
  -H "Content-Type: application/json" `
  --data-binary "@docs/http/question_create.json"

# Filtrar y buscar
curl.exe "http://127.0.0.1:8000/api/questions/?exam=1&search=Django"
```

## Pruebas

```powershell
.\venv\Scripts\python.exe manage.py test quiz
```

Cubren las cinco operaciones CRUD de los tres recursos, la validación de la opción
correcta, los errores 400, el filtro por examen, la búsqueda y la paginación.

## Estructura

```
config/                 settings, urls y wsgi del proyecto
src/quiz/
  models.py             Exam, Question, Choice
  serializers.py        serializadores de la API y validación
  api_views.py          los tres ModelViewSet
  api_urls.py           rutas del DefaultRouter
  tests_api.py          pruebas de la API
  management/commands/seed_quiz.py
docs/
  http/                 cuerpos JSON usados en las comprobaciones
  img/                  capturas de la API navegable
ENTREGABLE.md           documento del laboratorio
```

## Notas

- La API usa `AllowAny` y `PageNumberPagination` (5 por página) como punto de partida
  del laboratorio. En producción se cambiaría por `IsAuthenticated` o un permiso por rol.
- El endpoint de opciones permite editar una opción suelta; la invariante de «exactamente
  una correcta» se valida al crear o editar la pregunta completa.
