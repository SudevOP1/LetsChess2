from fastapi import Security, HTTPException, WebSocket
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from datetime import datetime, timedelta
from typing import Optional
from passlib.hash import pbkdf2_sha256  # pyrefly: ignore [missing-import]
from jose import JWTError, jwt
from asyncio import Queue

from utils.settings import get_settings
from utils.db import db

settings = get_settings()
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pbkdf2_sha256.hash(password + settings.JWT_SECRET)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return pbkdf2_sha256.verify(password + settings.JWT_SECRET, hashed)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> tuple[bool, dict | str]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, "token expired"
    except Exception:
        return False, "invalid token"


async def get_current_user_from_token(token: str) -> tuple[str, dict]:

    payload_ok, payload = verify_token(token)

    if not payload_ok:
        return False, payload

    username = payload.get("username")
    if not username:
        return False, "invalid token"

    # verify user still exists
    user = await db.users.find_one({"username": username})
    if not user:
        return False, "user not found"

    return True, {
        "id": str(user.get("_id")),
        "username": username,
        "elo": int(user.get("elo", 500)),
        "created_at": user.get("created_at"),
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> tuple[str, dict]:
    return await get_current_user_from_token(credentials.credentials)


async def authenticate_websocket_user(incoming_messages: Queue, websocket: WebSocket):
    while True:
        data = await incoming_messages.get()

        # invalid message type
        if data.get("type") != "access_token":
            await websocket.send_json(
                {
                    "type": "error",
                    "error": "access token required",
                }
            )
            continue

        token = data.get("access_token")

        # no token provided
        if not token:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": "no token provided",
                }
            )
            continue

        try:
            user_ok, user = await get_current_user_from_token(token)

            # auth error
            if not user_ok:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": user,
                    }
                )
                continue

            return user

        except HTTPException as e:
            await websocket.send_json(
                {
                    "type": "error",
                    "error": e.detail,
                }
            )
            continue

    return None


async def create_user(username: str, password: str):
    hashed = hash_password(password)

    result = await db.users.insert_one(
        {
            "username": username,
            "password": hashed,
            "elo": 500,
            "created_at": datetime.utcnow(),
        }
    )

    user = await db.users.find_one({"_id": result.inserted_id})
    return user
