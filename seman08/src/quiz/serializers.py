"""Serializers of the quiz API.

The choices travel nested inside their question (a question is created or
edited together with its options). The exam travels as an identifier: the
client sends ``exam: <id>`` instead of a nested exam object.
"""
from django.db import transaction
from rest_framework import serializers

from .models import Choice, Exam, Question


class NestedChoiceSerializer(serializers.ModelSerializer):
    """A choice as it appears inside a question: no ``question`` field."""

    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct"]
        read_only_fields = ["id"]


class ChoiceSerializer(serializers.ModelSerializer):
    """A choice as a standalone resource: it must say which question it belongs to."""

    class Meta:
        model = Choice
        fields = ["id", "question", "text", "is_correct"]
        read_only_fields = ["id"]


class ExamSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ["id", "title", "description", "created_at", "question_count"]
        read_only_fields = ["id", "created_at"]

    def get_question_count(self, obj):
        # The list/retrieve queryset annotates the count; after a create there
        # is no annotation yet, so fall back to counting (it is a new exam).
        count = getattr(obj, "question_count", None)
        if count is None:
            return obj.questions.count()
        return count


class QuestionSerializer(serializers.ModelSerializer):
    choices = NestedChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "exam", "text", "score", "choices"]
        read_only_fields = ["id"]

    def validate_choices(self, value):
        if len(value) == 0:
            raise serializers.ValidationError("Una pregunta necesita al menos una opción.")
        correct = [choice for choice in value if choice.get("is_correct")]
        if len(correct) != 1:
            raise serializers.ValidationError("Debe haber exactamente una opción correcta.")
        return value

    def create(self, validated_data):
        choices = validated_data.pop("choices")
        with transaction.atomic():
            question = Question.objects.create(**validated_data)
            Choice.objects.bulk_create(
                Choice(question=question, **choice) for choice in choices
            )
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            if choices is not None:  # sent choices replace the old ones
                instance.choices.all().delete()
                Choice.objects.bulk_create(
                    Choice(question=instance, **choice) for choice in choices
                )
        return instance
