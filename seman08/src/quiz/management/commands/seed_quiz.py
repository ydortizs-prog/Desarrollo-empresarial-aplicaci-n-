from django.core.management.base import BaseCommand

from quiz.models import Choice, Exam, Question

# Two exams with six questions each: enough data to see pagination (5 per page)
# and to filter questions by exam.
EXAMS = [
    {
        "title": "Examen de Django Básico",
        "description": "Preguntas de repaso sobre el flujo de trabajo de Django.",
        "questions": [
            (
                "¿Qué comando aplica las migraciones pendientes?",
                [
                    ("python manage.py migrate", True),
                    ("python manage.py runserver", False),
                    ("python manage.py collectstatic", False),
                    ("python manage.py shell", False),
                ],
            ),
            (
                "¿Qué clase de vista basada en clase lista objetos?",
                [
                    ("ListView", True),
                    ("DetailView", False),
                    ("CreateView", False),
                    ("TemplateView", False),
                ],
            ),
            (
                "¿En qué archivo se declaran los modelos?",
                [
                    ("models.py", True),
                    ("views.py", False),
                    ("urls.py", False),
                    ("admin.py", False),
                ],
            ),
            (
                "¿Qué comando crea un proyecto de Django?",
                [
                    ("django-admin startproject", True),
                    ("python manage.py startapp", False),
                    ("python manage.py migrate", False),
                    ("python manage.py shell", False),
                ],
            ),
            (
                "¿Qué método del ORM devuelve un QuerySet?",
                [
                    ("filter()", True),
                    ("get()", False),
                    ("save()", False),
                    ("delete()", False),
                ],
            ),
            (
                "¿En qué archivo vive la configuración del proyecto?",
                [
                    ("settings.py", True),
                    ("models.py", False),
                    ("urls.py", False),
                    ("wsgi.py", False),
                ],
            ),
        ],
    },
    {
        "title": "Examen de Django REST Framework",
        "description": "Preguntas sobre serializadores, vistas y rutas de DRF.",
        "questions": [
            (
                "¿Qué clase convierte un modelo en JSON?",
                [
                    ("ModelSerializer", True),
                    ("ModelForm", False),
                    ("ModelAdmin", False),
                    ("ModelView", False),
                ],
            ),
            (
                "¿Qué clase agrupa las rutas de una API?",
                [
                    ("DefaultRouter", True),
                    ("ListView", False),
                    ("FormView", False),
                    ("AdminSite", False),
                ],
            ),
            (
                "¿Qué ViewSet ofrece list, create, retrieve, update y destroy?",
                [
                    ("ModelViewSet", True),
                    ("APIView", False),
                    ("ViewSet", False),
                    ("GenericAPIView", False),
                ],
            ),
            (
                "¿Qué permiso deja leer a cualquiera y escribir solo a autenticados?",
                [
                    ("IsAuthenticatedOrReadOnly", True),
                    ("AllowAny", False),
                    ("IsAdminUser", False),
                    ("IsAuthenticated", False),
                ],
            ),
            (
                "¿Qué filtro busca texto en los campos declarados?",
                [
                    ("SearchFilter", True),
                    ("OrderingFilter", False),
                    ("DjangoFilterBackend", False),
                    ("PageNumberPagination", False),
                ],
            ),
            (
                "¿Qué parámetro de consulta elige la página?",
                [
                    ("page", True),
                    ("offset", False),
                    ("limit", False),
                    ("cursor", False),
                ],
            ),
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Carga dos exámenes con seis preguntas y cuatro opciones cada una "
        "(datos fijos para probar la API)."
    )

    def handle(self, *args, **options):
        exams_created = 0
        questions_created = 0
        choices_created = 0

        for exam_data in EXAMS:
            exam, exam_created = Exam.objects.get_or_create(
                title=exam_data["title"],
                defaults={"description": exam_data["description"]},
            )
            if exam_created:
                exams_created += 1

            for question_text, choices_data in exam_data["questions"]:
                question, question_created = Question.objects.get_or_create(
                    exam=exam,
                    text=question_text,
                )
                if question_created:
                    questions_created += 1

                for choice_text, is_correct in choices_data:
                    _, choice_created = Choice.objects.get_or_create(
                        question=question,
                        text=choice_text,
                        defaults={"is_correct": is_correct},
                    )
                    if choice_created:
                        choices_created += 1

        self.stdout.write(self.style.SUCCESS("Resumen del seed:"))
        self.stdout.write(f"  Exámenes creados en esta corrida: {exams_created}")
        self.stdout.write(f"  Preguntas creadas en esta corrida: {questions_created}")
        self.stdout.write(f"  Opciones creadas en esta corrida: {choices_created}")
        self.stdout.write(
            "  Totales actuales -> "
            f"Exams: {Exam.objects.count()}, "
            f"Questions: {Question.objects.count()}, "
            f"Choices: {Choice.objects.count()}"
        )
