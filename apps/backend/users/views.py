from rest_framework.decorators import api_view
from django.contrib.auth.models import User

from utils.helpers import *

@api_view(["POST"])
def register_user(request):
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

