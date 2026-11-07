"""Tests of the quiz API: the five CRUD operations, validation, filters and pagination."""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Choice, Exam, Question


class QuizAPITests(APITestCase):
    def setUp(self):
        self.exam = Exam.objects.create(title="Examen 1", description="Primero")
        self.other = Exam.objects.create(title="Examen 2", description="Segundo")

        for i in range(6):
            question = Question.objects.create(exam=self.exam, text=f"Pregunta {i}")
            Choice.objects.create(question=question, text="Correcta", is_correct=True)
            Choice.objects.create(question=question, text="Incorrecta", is_correct=False)

        for i in range(6):
            question = Question.objects.create(exam=self.other, text=f"Otra {i}")
            Choice.objects.create(question=question, text="Correcta", is_correct=True)
            Choice.objects.create(question=question, text="Incorrecta", is_correct=False)

    def test_exams_list_is_paginated_and_shows_question_count(self):
        response = self.client.get(reverse("exam-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertEqual(response.data["results"][0]["question_count"], 6)

    def test_exam_crud_returns_the_expected_status_codes(self):
        # Create -> 201
        response = self.client.post(
            reverse("exam-list"),
            {"title": "Examen nuevo", "description": "Creado por la API"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        exam_id = response.data["id"]

        # Retrieve -> 200
        response = self.client.get(reverse("exam-detail", args=[exam_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Examen nuevo")

        # Partial update -> 200
        response = self.client.patch(
            reverse("exam-detail", args=[exam_id]),
            {"title": "Examen actualizado"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Examen actualizado")

        # Delete -> 204
        response = self.client.delete(reverse("exam-detail", args=[exam_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Exam.objects.filter(id=exam_id).exists())

    def test_create_question_with_nested_choices(self):
        payload = {
            "exam": self.exam.id,
            "text": "¿Qué es Django REST Framework?",
            "score": 2,
            "choices": [
                {"text": "Un framework para APIs", "is_correct": True},
                {"text": "Un lenguaje", "is_correct": False},
                {"text": "Una base de datos", "is_correct": False},
            ],
        }
        response = self.client.post(reverse("question-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["exam"], self.exam.id)
        self.assertEqual(len(response.data["choices"]), 3)
        self.assertEqual(
            [choice["is_correct"] for choice in response.data["choices"]],
            [True, False, False],
        )

    def test_question_requires_exactly_one_correct_choice(self):
        payload = {
            "exam": self.exam.id,
            "text": "Pregunta sin respuesta correcta",
            "choices": [
                {"text": "A", "is_correct": False},
                {"text": "B", "is_correct": False},
            ],
        }
        response = self.client.post(reverse("question-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("choices", response.data)

        payload["choices"] = [
            {"text": "A", "is_correct": True},
            {"text": "B", "is_correct": True},
        ]
        response = self.client.post(reverse("question-list"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("choices", response.data)

    def test_missing_required_field_returns_400(self):
        response = self.client.post(
            reverse("question-list"),
            {"exam": self.exam.id, "choices": [{"text": "A", "is_correct": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("text", response.data)

    def test_wrong_type_returns_400(self):
        response = self.client.post(
            reverse("question-list"),
            {
                "exam": self.exam.id,
                "text": "Pregunta con score inválido",
                "score": "no-es-un-numero",
                "choices": [{"text": "A", "is_correct": True}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("score", response.data)

    def test_filter_by_exam(self):
        response = self.client.get(reverse("question-list"), {"exam": self.exam.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 6)
        for item in response.data["results"]:
            self.assertEqual(item["exam"], self.exam.id)

    def test_search_by_question_text(self):
        response = self.client.get(reverse("question-list"), {"search": "Pregunta 1"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["text"], "Pregunta 1")

    def test_pagination_has_more_than_one_page(self):
        response = self.client.get(reverse("question-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 12)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertIsNotNone(response.data["next"])

        response = self.client.get(reverse("question-list"), {"page": 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNone(response.data["next"])

    def test_choice_crud_returns_the_expected_status_codes(self):
        question = Question.objects.filter(exam=self.exam).first()
        # Create -> 201
        response = self.client.post(
            reverse("choice-list"),
            {"question": question.id, "text": "Opción nueva", "is_correct": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        choice_id = response.data["id"]

        # Retrieve -> 200
        response = self.client.get(reverse("choice-detail", args=[choice_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Partial update -> 200
        response = self.client.patch(
            reverse("choice-detail", args=[choice_id]),
            {"text": "Opción editada"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], "Opción editada")

        # Delete -> 204
        response = self.client.delete(reverse("choice-detail", args=[choice_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_question_detail_and_update_replace_nested_choices(self):
        question = Question.objects.filter(exam=self.exam).first()
        response = self.client.get(reverse("question-detail", args=[question.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.patch(
            reverse("question-detail", args=[question.id]),
            {
                "choices": [
                    {"text": "Nueva correcta", "is_correct": True},
                    {"text": "Nueva incorrecta", "is_correct": False},
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["choices"]), 2)
        self.assertEqual(question.choices.count(), 2)
