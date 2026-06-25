from fastapi import APIRouter, Depends
import traceback

from utils.auth import get_current_user
from utils import debug

user_router = APIRouter()


@user_router.get("/me")
async def me(auth_result=Depends(get_current_user)):
    try:
        auth_success, current_user = auth_result
        if not auth_success:
            return {"success": False, "error": current_user, "status_code": 401}

        return {"success": True, "me": {**current_user}}

    except Exception as e:
        debug.error(
            "500 GET /user/me",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
