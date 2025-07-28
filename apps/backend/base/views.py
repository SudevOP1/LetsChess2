from django.http import JsonResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required

from .models import ChessGame

# Create your views here.

waiting_player = None

def hello(request):
    return JsonResponse({"success": True, "msg": "hello",})

@login_required
def find_game(request):
    if request.method != "GET":
        return JsonResponse({
            "success": False,
            "error": "only GET requests allowed"
        })
    
    global waiting_player
    current_user = request.user

    try:
        # check if someone is already waiting
        if (waiting_player is None) or (waiting_player == current_user.id):
            waiting_player = current_user.id
            return JsonResponse({
                "success": True,
                "status": "waiting",
                "msg": "waiting for opponent...",
            })
        
        # else match found
        opponent_id = current_user.id
        waiting_player = None
        opponent = type(current_user).objects.get(id=opponent_id)

        # create game
        game = ChessGame.objects.create(
            start_time=timezone.now(),
            player1=opponent,
            player2=current_user,
            moves="",
        )

        return JsonResponse({
            "success": True,
            "status" : "found",
            "game_id": game.id,
            "player1": opponent.username,
            "player2": current_user.username,
        })
    
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e),
        })
