from django.http import JsonResponse
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

from .chess_helpers import *

User = get_user_model()

def print_debug(something, end="\n"):
    print(f"[DEBUG] {something}", end=end)

def UnsuccessfulResponse(error):
    return JsonResponse({
        "success": False,
        "error": error,
    })

def SuccessfulResponse(response: dict):
    return JsonResponse({
        **response,
        "success": True,
    })

@sync_to_async
def get_user_from_access_token(token):
    try:
        access_token = AccessToken(token)
        user_id = access_token["user_id"]
        user = User.objects.get(id=user_id)
        return True, user
    except Exception as e:
        return False, f"invalid token: {str(e)}"

@sync_to_async
def check_user_participation(user, game_obj):
    return user == game_obj.player1 or user == game_obj.player2

