from django.urls import path

from . import views

app_name = "quiz"

urlpatterns = [
    path("", views.ExamListView.as_view(), name="exam_list"),
    path("<int:pk>/", views.ExamDetailView.as_view(), name="exam_detail"),
    path("<int:exam_pk>/questions/add/", views.question_create, name="question_create"),
]
