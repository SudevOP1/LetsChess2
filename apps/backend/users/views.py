from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User

from utils.helpers import *
import json

@allow_methods(["POST"])
@csrf_exempt
def signup_user(request):
    try:
        data = json.loads(request.body)
        username = data["username"]
        email = data["email"]
        password = data["password"]

        if User.objects.filter(username=username).exists():
            return UnsuccessfulResponse("username already exists")
        
        # TODO: continue from here

    except Exception as e: return JsonResponse(str(e))


