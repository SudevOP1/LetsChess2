from django.http import JsonResponse
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

from functools import wraps


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

def allow_methods(methods):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                allowed_methods = ", ".join(methods)
                plural = "s" if len(methods) > 1 else ""
                return JsonResponse(f"only {allowed_methods} method{plural} allowed")
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator

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
def get_game_data(game_obj):
    return {
        "id"        : str(game_obj.id),
        "white"     : game_obj.player1.username,
        "black"     : game_obj.player2.username,
        "winner"    : game_obj.get_winner_display(),
        "start_time": game_obj.start_time.isoformat() if game_obj.start_time else None,
    }

@sync_to_async
def check_user_participation(user, game_obj):
    return user == game_obj.player1 or user == game_obj.player2

