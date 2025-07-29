from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

from utils.helpers import *
import json

@allow_methods(["POST"])
@csrf_exempt
def register_user(request):
    try:
        data = json.loads(request.body)
        username = data["username"]
        email = data["email"]
        password = data["password"]

        if User.objects.filter(username=username).exists():
            return UnsuccessfulResponse("username already exists")

        if User.objects.filter(email=email).exists():
            return UnsuccessfulResponse("email already exists")
        
        user = User.objects.create(username=username, email=email, password=password)
        return SuccessfulResponse({"msg": "user registered successfully"})

    except Exception as e: return JsonResponse(str(e))

@allow_methods(["POST"])
@csrf_exempt
def login_user(request):
    try:
        # get data from post body
        data = json.loads(request.body)
        username = data["username"]
        password = data["password"]
        
        # try to authenticate
        user = authenticate(request, username=username, password=password)

        # authentication successful
        if user is not None:
            login(request, user)
            return SuccessfulResponse({"msg": "logged in successfully"})
        
        # authentication unsuccessful
        return UnsuccessfulResponse("invalid credentials")
    except Exception as e: return JsonResponse(str(e))


