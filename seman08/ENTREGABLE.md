# Entregable — Semana 8: API con Django REST Framework

**Curso:** Desarrollo de Aplicaciones Empresariales (DAE)
**Laboratorio:** API con Django REST Framework — exámenes, preguntas y opciones
**Carpeta en el repositorio del equipo:** `seman08/`
**Proyecto:** `dae3b-quiz-lab` (aplicación de cuestionarios del curso) + Django REST Framework

## Resumen de resultados

| Comprobación | Resultado |
|---|---|
| `manage.py check` | Sin incidencias |
| `manage.py migrate` | Correcto |
| `manage.py seed_quiz` | 2 exámenes · 12 preguntas · 48 opciones |
| `manage.py test quiz` | **11/11 pruebas en verde** |
| Recursos publicados | 3 (`exams`, `questions`, `choices`) en un `DefaultRouter` |
| Operaciones por HTTP externo | 5/5 en los tres recursos, con el código correcto |
| Errores provocados | 400 con mensaje en los cuatro casos |
| Filtro / búsqueda / paginación | `?exam=1` → 6; `?search=Django` → 1; 12 en páginas de 5/5/2 |
| API navegable | Raíz, listas, detalle y formulario HTML verificados con capturas |

---

## Paso 1 — Proyecto base, instalación de DRF e `INSTALLED_APPS`

Se partió del proyecto de cuestionarios del curso (`dae3b-quiz-lab`), que ya tiene los
modelos `Exam`, `Question` y `Choice`, las vistas web y el comando `seed_quiz`. Sobre esa
base se instaló Django REST Framework y se declaró en `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ...
    'django.contrib.staticfiles',
    'rest_framework',
    'quiz',
]
```

La aplicación `quiz` ya estaba declarada. Dependencias (`requirements.txt`):

```text
Django==6.1.1
djangorestframework==3.18.3
python-decouple==3.8
```

## Paso 2 — Bloque `REST_FRAMEWORK` en `settings.py`

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 5,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
    ],
}
```

Decisiones:

- **Paginación por defecto** de 5 objetos por página. Con 12 preguntas sembradas se
  obtienen tres páginas (5 + 5 + 2), suficientes para comprobar el efecto.
- **Permiso de partida `AllowAny`** para poder recorrer la API con `curl` sin tokens,
  como pide el laboratorio. En producción se cambiaría por `IsAuthenticated` o por un
  permiso por rol; se deja anotado en el propio `settings.py`.
- **`SearchFilter`** como backend por defecto para habilitar `?search=`.

## Paso 3 — Serializadores

Tres serializadores derivados de `ModelSerializer` en `src/quiz/serializers.py`:

| Serializador | Modelo | Campos | Solo lectura |
|---|---|---|---|
| `ExamSerializer` | `Exam` | `id`, `title`, `description`, `created_at`, `question_count` | `id`, `created_at`, `question_count` |
| `QuestionSerializer` | `Question` | `id`, `exam`, `text`, `score`, `choices` | `id` |
| `NestedChoiceSerializer` | `Choice` | `id`, `text`, `is_correct` | `id` |
| `ChoiceSerializer` | `Choice` | `id`, `question`, `text`, `is_correct` | `id` |

`question_count` es un `SerializerMethodField` que aprovecha la anotación `Count` del
queryset de exámenes; tras crear un examen (sin anotación todavía) cuenta sus preguntas.

```python
class ExamSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ["id", "title", "description", "created_at", "question_count"]
        read_only_fields = ["id", "created_at"]

    def get_question_count(self, obj):
        count = getattr(obj, "question_count", None)
        if count is None:
            return obj.questions.count()
        return count
```

## Paso 4 — Cómo viajan las relaciones

- **Las opciones viajan anidadas dentro de la pregunta.** El cliente envía
  `choices: [...]` dentro del cuerpo de la pregunta y recibe las opciones con sus `id`
  dentro de la misma respuesta. Por eso `NestedChoiceSerializer` no expone `question`:
  el vínculo lo pone el serializador padre.
- **El examen viaja por identificador.** La pregunta envía `exam: <id>` (un
  `PrimaryKeyRelatedField` que genera DRF a partir de la `ForeignKey`). No se anida el
  examen completo: evita duplicar datos y hace explícito a qué examen pertenece.
- **Las opciones también son un recurso propio.** `ChoiceSerializer` (con `question`)
  permite listar, crear, editar y borrar una opción suelta en `/api/choices/`.

## Paso 5 — Validación propia: exactamente una opción correcta

```python
def validate_choices(self, value):
    if len(value) == 0:
        raise serializers.ValidationError("Una pregunta necesita al menos una opción.")
    correct = [choice for choice in value if choice.get("is_correct")]
    if len(correct) != 1:
        raise serializers.ValidationError("Debe haber exactamente una opción correcta.")
    return value
```

Se aplica al crear y al editar la pregunta completa. La escritura es atómica
(`transaction.atomic`): si algo falla, no queda una pregunta a medias. Al editar con
`choices`, las opciones anteriores se reemplazan por las nuevas.

## Paso 6 — Conjuntos de vistas y enrutador

`src/quiz/api_views.py`:

```python
class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    queryset = Exam.objects.annotate(question_count=Count("questions")).order_by("id")


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["text"]

    def get_queryset(self):
        queryset = (Question.objects.select_related("exam")
                    .prefetch_related("choices").order_by("id"))
        exam = self.request.query_params.get("exam")
        if exam and exam.isdigit():
            queryset = queryset.filter(exam_id=int(exam))
        return queryset


class ChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = ChoiceSerializer
    queryset = Choice.objects.select_related("question").order_by("id")
```

`src/quiz/api_urls.py`:

```python
router = DefaultRouter()
router.register("exams", ExamViewSet, basename="exam")
router.register("questions", QuestionViewSet, basename="question")
router.register("choices", ChoiceViewSet, basename="choice")

urlpatterns = router.urls
```

`config/urls.py` incluye las rutas bajo `/api/` y conserva las páginas web en `/`:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('quiz.api_urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('', include('quiz.urls')),
]
```

Rutas generadas por el enrutador:

| Recurso | Colección | Detalle |
|---|---|---|
| Exámenes | `/api/exams/` | `/api/exams/{id}/` |
| Preguntas | `/api/questions/` | `/api/questions/{id}/` |
| Opciones | `/api/choices/` | `/api/choices/{id}/` |

## Paso 7 — Recorrido por la API navegable

Desde el navegador (`http://127.0.0.1:8000/api/`) se recorrieron las cinco operaciones
en los tres recursos. Códigos observados:

| Operación | Método y ruta | Código |
|---|---|---|
| Listar | `GET /api/exams/` | 200 |
| Ver detalle | `GET /api/exams/1/` | 200 |
| Crear | `POST /api/exams/` | 201 |
| Modificar parcialmente | `PATCH /api/exams/4/` | 200 |
| Eliminar | `DELETE /api/exams/4/` | 204 |
| Detalle inexistente | `GET /api/exams/4/` | 404 |

Las mismas operaciones se repitieron en `questions` y `choices` con idénticos códigos.
La API navegable muestra el formulario HTML de creación, los enlaces a cada recurso y la
posibilidad de cambiar entre «Raw data» y «HTML form».

Capturas en `docs/img/`:

- `api-root.png` — raíz con los tres recursos enlazados.
- `api-exams-list.png` — lista paginada y formulario de creación.
- `api-question-detail.png` — detalle con las opciones anidadas.
- `api-questions-filter.png` — filtro por examen.
- `api-questions-page2.png` — segunda página de resultados.

## Paso 8 — Cliente HTTP externo

Se usó `curl.exe` con cuerpos JSON. La transcripción completa, con comandos y salidas,
está en [`docs/http/TRANSCRIPCION.md`](docs/http/TRANSCRIPCION.md); los cuerpos de
ejemplo están en `docs/http/*.json`.

Resultado: las cinco operaciones devolvieron **exactamente los mismos códigos y la misma
forma de respuesta** que la API navegable.

| Recurso | Crear | Detalle | PATCH | DELETE |
|---|---|---|---|---|
| Exámenes | 201 | 200 | 200 | 204 |
| Preguntas | 201 | 200 | 200 | 204 |
| Opciones | 201 | 200 | 200 | 204 |

Ejemplo de creación de una pregunta con opciones anidadas:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/questions/ `
  -H "Content-Type: application/json" `
  --data-binary "@docs/http/question_create.json"
```

```json
HTTP 201
{
  "id": 14,
  "exam": 1,
  "text": "¿Qué clase de DRF publica un recurso completo?",
  "score": 2,
  "choices": [
    {"id": 55, "text": "ModelViewSet", "is_correct": true},
    {"id": 56, "text": "APIView", "is_correct": false},
    {"id": 57, "text": "TemplateView", "is_correct": false}
  ]
}
```

## Paso 9 — Tres errores provocados

| Caso | Cuerpo enviado | Código | Mensaje de la API |
|---|---|---|---|
| Campo obligatorio ausente (`text`) | `{"exam":1,"choices":[{"text":"A","is_correct":true}]}` | **400** | `{"text":["Este campo es requerido."]}` |
| Tipo incorrecto (`score` con texto) | `{"exam":1,"text":"Score invalido","score":"no-es-un-numero","choices":[...]}` | **400** | `{"score":["Introduzca un número entero válido."]}` |
| Ninguna opción correcta | dos opciones con `is_correct: false` | **400** | `{"choices":["Debe haber exactamente una opción correcta."]}` |
| Dos opciones correctas | dos opciones con `is_correct: true` | **400** | `{"choices":["Debe haber exactamente una opción correcta."]}` |

Comprobaciones adicionales de error:

| Caso | Código | Mensaje |
|---|---|---|
| Detalle inexistente (`/api/exams/9999/`) | 404 | `{"detail":"No Exam matches the given query."}` |
| Página fuera de rango (`?page=99`) | 404 | `{"detail":"Página inválida."}` |

Los mensajes salen en español porque `LANGUAGE_CODE = 'es'`. Los cuerpos usados están en
`docs/http/err_missing.json`, `err_type.json`, `err_zero.json` y `err_two.json`.

## Paso 10 — Filtro por examen, búsqueda y paginación

| Consulta | Resultado |
|---|---|
| `GET /api/questions/` | 12 en total; página 1 con 5, `next` a la página 2 |
| `GET /api/questions/?page=2` | 5 resultados; `next` a la página 3 |
| `GET /api/questions/?page=3` | 2 resultados; `next: null` |
| `GET /api/questions/?exam=1` | 6 resultados (solo del examen 1); 2 páginas |
| `GET /api/questions/?search=Django` | 1 resultado (el enunciado que contiene «Django») |
| `GET /api/questions/?page=99` | 404, `Página inválida.` |

El filtro por examen se implementa en `get_queryset` leyendo `?exam=`; la búsqueda usa
`SearchFilter` sobre `text`. Ambos se combinan con la paginación global.

## Paso 11 — Tabla de la API

### Recurso: exámenes (`/api/exams/`)

| Método | Dirección | Cuerpo de ejemplo | Respuesta esperada |
|---|---|---|---|
| `GET` | `/api/exams/` | — | **200** `{"count":2,"next":null,"previous":null,"results":[{"id":1,"title":"...","description":"...","created_at":"...","question_count":6}, ...]}` |
| `POST` | `/api/exams/` | `{"title":"Examen de prueba","description":"Creado desde un cliente HTTP"}` | **201** `{"id":4,"title":"Examen de prueba","description":"...","created_at":"...","question_count":0}` |
| `GET` | `/api/exams/{id}/` | — | **200** el examen con `question_count` |
| `PUT` | `/api/exams/{id}/` | `{"title":"...","description":"..."}` | **200** el examen reemplazado |
| `PATCH` | `/api/exams/{id}/` | `{"title":"Examen editado por HTTP"}` | **200** el examen con el título nuevo |
| `DELETE` | `/api/exams/{id}/` | — | **204** sin cuerpo (borra en cascada sus preguntas y opciones) |

### Recurso: preguntas (`/api/questions/`)

| Método | Dirección | Cuerpo de ejemplo | Respuesta esperada |
|---|---|---|---|
| `GET` | `/api/questions/` | — | **200** página de 5 con `count`, `next`, `previous` y `results` (cada una con `choices` anidadas) |
| `GET` | `/api/questions/?exam=1` | — | **200** solo preguntas del examen 1 |
| `GET` | `/api/questions/?search=Django` | — | **200** preguntas cuyo `text` contiene «Django» |
| `GET` | `/api/questions/?page=2` | — | **200** segunda página; `page=3` trae las 2 restantes |
| `POST` | `/api/questions/` | `{"exam":1,"text":"¿Qué clase de DRF publica un recurso completo?","score":2,"choices":[{"text":"ModelViewSet","is_correct":true},{"text":"APIView","is_correct":false},{"text":"TemplateView","is_correct":false}]}` | **201** la pregunta con `id` y las opciones con sus `id` |
| `GET` | `/api/questions/{id}/` | — | **200** la pregunta con sus opciones |
| `PUT` | `/api/questions/{id}/` | pregunta completa con `exam`, `text`, `score` y `choices` | **200** la pregunta reemplazada |
| `PATCH` | `/api/questions/{id}/` | `{"choices":[{"text":"Correcta reemplazada","is_correct":true},{"text":"Incorrecta reemplazada","is_correct":false}]}` | **200** la pregunta con las opciones nuevas (reemplaza las anteriores) |
| `DELETE` | `/api/questions/{id}/` | — | **204** sin cuerpo |

### Recurso: opciones (`/api/choices/`)

| Método | Dirección | Cuerpo de ejemplo | Respuesta esperada |
|---|---|---|---|
| `GET` | `/api/choices/` | — | **200** página de 5 con `count`, `next`, `previous` y `results` |
| `POST` | `/api/choices/` | `{"question":1,"text":"Opción suelta","is_correct":false}` | **201** `{"id":58,"question":1,"text":"Opción suelta","is_correct":false}` |
| `GET` | `/api/choices/{id}/` | — | **200** la opción |
| `PUT` | `/api/choices/{id}/` | `{"question":1,"text":"...","is_correct":false}` | **200** la opción reemplazada |
| `PATCH` | `/api/choices/{id}/` | `{"text":"Opcion editada por HTTP"}` | **200** la opción con el texto nuevo |
| `DELETE` | `/api/choices/{id}/` | — | **204** sin cuerpo |

### Errores transversales

| Método | Dirección | Cuerpo de ejemplo | Respuesta esperada |
|---|---|---|---|
| `POST` | `/api/questions/` | sin `text` | **400** `{"text":["Este campo es requerido."]}` |
| `POST` | `/api/questions/` | `score` con texto | **400** `{"score":["Introduzca un número entero válido."]}` |
| `POST` | `/api/questions/` | 0 o 2 opciones correctas | **400** `{"choices":["Debe haber exactamente una opción correcta."]}` |
| `GET` | `/api/exams/{id}/` | `id` inexistente | **404** `{"detail":"No Exam matches the given query."}` |
| `GET` | `/api/questions/?page=99` | — | **404** `{"detail":"Página inválida."}` |

## Paso 12 — Repositorio y campus virtual

- Proyecto copiado a la carpeta **`seman08/`** del repositorio del equipo
  <https://github.com/ydortizs-prog/Desarrollo-empresarial-aplicaci-n->.
- Este documento (`seman08/ENTREGABLE.md`) es el que se sube al campus virtual.
- Para ejecutarlo: `pip install -r requirements.txt`, `manage.py migrate`,
  `manage.py seed_quiz` y `manage.py runserver`.

## Pruebas automatizadas

```powershell
.\venv\Scripts\python.exe manage.py test quiz
```

```text
Ran 11 tests in 0.229s
OK
```

Cubren: lista paginada de exámenes con `question_count`, CRUD de exámenes con sus códigos,
creación de pregunta con opciones anidadas, validación de exactamente una correcta,
campo ausente, tipo incorrecto, filtro por examen, búsqueda, paginación y CRUD de opciones.

## Autoevaluación con la rúbrica

| Criterio | Puntos | Justificación |
|---|---:|---|
| Serializadores derivados del modelo y validación | 5/5 | Tres `ModelSerializer`; validación propia de la opción correcta; relaciones decididas y documentadas (opciones anidadas, examen por id). |
| Recursos publicados con `ViewSet` y enrutador | 5/5 | Los tres recursos en un `DefaultRouter`, navegables desde la API navegable. |
| Comprobación HTTP y códigos de estado | 5/5 | Las cinco operaciones desde `curl` en los tres recursos; 200/201/204 y errores 400/404 correctos. |
| Repositorio y tabla de la API | 5/5 | Tabla completa por recurso, con cuerpo y respuesta, contrastada con la API real. |

## Limitaciones conocidas

- `AllowAny` es deliberado para el laboratorio; no debe quedarse así en producción.
- El endpoint de opciones permite editar una opción suelta; la invariante de «exactamente
  una correcta» se valida al crear o editar la pregunta completa, no al tocar una opción
  aislada.
- `PUT` exige el cuerpo completo; para cambios parciales se usa `PATCH`.
