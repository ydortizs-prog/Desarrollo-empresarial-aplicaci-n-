from django import forms
from django.forms import inlineformset_factory

from .models import Choice, Exam, Question


class ExamForm(forms.ModelForm):
    class Meta:
        model = Exam
        fields = ["title", "description"]


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ["text", "score"]


class ChoiceForm(forms.ModelForm):
    class Meta:
        model = Choice
        fields = ["text", "is_correct"]


class BaseChoiceFormSet(forms.BaseInlineFormSet):
    """Inline formset that enforces exactly one correct choice.

    Counts forms that are not marked for deletion and that have
    non-empty cleaned_data, and requires exactly one of them to have
    is_correct=True. Errors raised here surface as formset.non_form_errors().
    """

    def clean(self):
        super().clean()
        if any(self.errors):
            return

        correct_count = 0
        active_forms = 0
        for form in self.forms:
            cleaned_data = getattr(form, "cleaned_data", None)
            if not cleaned_data:
                continue
            if cleaned_data.get("DELETE"):
                continue
            active_forms += 1
            if cleaned_data.get("is_correct"):
                correct_count += 1

        if active_forms and correct_count != 1:
            raise forms.ValidationError(
                "Debe haber exactamente una respuesta marcada como correcta."
            )


ChoiceFormSet = inlineformset_factory(
    Question,
    Choice,
    form=ChoiceForm,
    formset=BaseChoiceFormSet,
    extra=4,
    min_num=2,
    validate_min=True,
    can_delete=True,
)
