from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User

from utils.helpers import *

@api_view(["POST"])
def register_user(request):
    try:
        username    = request.data.get("username")
        email       = request.data.get("email")
        password    = request.data.get("password")

        if not username or not password:
            return UnsuccessfulResponse("Username and password required")

        if User.objects.filter(username=username).exists():
            return UnsuccessfulResponse("Username already taken")

        user = User(username=username, email=email)
        user.set_password(password)
        user.save()

        return SuccessfulResponse({"message": "User created successfully"})
    except Exception as e: return UnsuccessfulResponse(str(e))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    try:
        user = request.user
        return SuccessfulResponse({
            "username": user.username,
            "email": user.email
        })
    except Exception as e: return UnsuccessfulResponse(str(e))

