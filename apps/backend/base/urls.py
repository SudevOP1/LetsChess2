from django.urls import path
from . import views

urlpatterns = [
    path("", views.hello),
    path("find_game", views.find_game),
]
