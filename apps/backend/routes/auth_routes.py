from fastapi import APIRouter, Body
import traceback

from utils.db import db
from utils.auth import verify_password, create_access_token, create_user
from utils import debug

auth_router = APIRouter()


@auth_router.post("/signup")
async def signup(username: str = Body(...), password: str = Body(...)):
    try:
        existing_user = await db.users.find_one({"username": username})

        if existing_user:
            return {
                "success": False,
                "error": "user already exists",
                "status_code": 409,
            }

        user = await create_user(
            username=username,
            password=password,
        )

        return {
            "success": True,
            "user": {
                "id": str(user.get("_id")),
                "username": user.get("username"),
                "created_at": user.get("created_at").isoformat(),
            },
        }

    except Exception as e:
        debug.error(
            f"500 POST /auth/signup",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@auth_router.post("/login")
async def login(username: str = Body(...), password: str = Body(...)):
    try:
        user = await db.users.find_one({"username": username})

        if not user or not verify_password(password, user.get("password")):
            return {
                "success": False,
                "error": "invalid credentials",
                "status_code": 401,
            }

        access_token = create_access_token(data={"username": user.get("username")})

        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "id": str(user.get("_id")),
            "username": user.get("username"),
        }

    except Exception as e:
        debug.error(
            f"500 POST /auth/login",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
