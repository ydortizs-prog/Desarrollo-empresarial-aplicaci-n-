from django.shortcuts import get_object_or_404, redirect, render
from django.views.generic import DetailView, ListView

from .forms import ChoiceFormSet, QuestionForm
from .models import Exam, Question


class ExamListView(ListView):
    model = Exam
    template_name = "quiz/exam_list.html"
    context_object_name = "exams"


class ExamDetailView(DetailView):
    model = Exam
    template_name = "quiz/exam_detail.html"
    context_object_name = "exam"


def question_create(request, exam_pk):
    exam = get_object_or_404(Exam, pk=exam_pk)

    if request.method == "POST":
        question_form = QuestionForm(request.POST)
        formset = ChoiceFormSet(request.POST, instance=Question())

        # formset.is_valid() runs BaseChoiceFormSet.clean(), which already
        # rejects the submission unless exactly one choice is is_correct=True.
        # If either the question form or the formset is invalid (including
        # that "exactly one correct choice" rule), we fall through and
        # re-render the template with the bound forms and their errors.
        if question_form.is_valid() and formset.is_valid():
            question = question_form.save(commit=False)
            question.exam = exam
            question.save()
            formset.instance = question
            formset.save()
            return redirect("quiz:exam_detail", pk=exam.pk)
    else:
        question_form = QuestionForm()
        formset = ChoiceFormSet(instance=Question())

    return render(
        request,
        "quiz/question_form.html",
        {
            "exam": exam,
            "question_form": question_form,
            "formset": formset,
        },
    )
