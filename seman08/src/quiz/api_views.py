"""ViewSets of the three quiz resources: exams, questions and choices."""
from django.db.models import Count
from rest_framework import filters, viewsets

from .models import Choice, Exam, Question
from .serializers import ChoiceSerializer, ExamSerializer, QuestionSerializer


class ExamViewSet(viewsets.ModelViewSet):
    """CRUD for exams. ``question_count`` comes annotated by the queryset."""

    serializer_class = ExamSerializer
    queryset = Exam.objects.annotate(question_count=Count("questions")).order_by("id")


class QuestionViewSet(viewsets.ModelViewSet):
    """CRUD for questions, with filtering by exam and search by text."""

    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["text"]

    def get_queryset(self):
        queryset = (
            Question.objects.select_related("exam")
            .prefetch_related("choices")
            .order_by("id")
        )
        exam = self.request.query_params.get("exam")
        if exam and exam.isdigit():
            queryset = queryset.filter(exam_id=int(exam))
        return queryset


class ChoiceViewSet(viewsets.ModelViewSet):
    """CRUD for individual choices (they also travel nested inside a question)."""

    serializer_class = ChoiceSerializer
    queryset = Choice.objects.select_related("question").order_by("id")
