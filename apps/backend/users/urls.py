from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    path("register/",   views.register_user,            name="token_refresh"),
    path("login/",      TokenObtainPairView.as_view(),  name="token_obtain_pair"),
    path("refresh/",    TokenRefreshView.as_view(),     name="token_refresh"),
]