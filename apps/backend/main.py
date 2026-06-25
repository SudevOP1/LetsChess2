from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys

from utils import debug
from utils.db import create_collections_if_not_exists
from utils.settings import get_settings
from routes.auth_routes import auth_router
from routes.user_routes import user_router
from routes.game_routes import game_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):

    # startup
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    debug.create_log_file_if_not_exists()
    await create_collections_if_not_exists(
        [
            "users",
            "games",
            "matchmaking",
        ]
    )

    yield

    # shutdown


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=[
        "http://localhost:5173",
    ],
)


app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router, prefix="/user", tags=["Users"])
app.include_router(game_router, prefix="/game", tags=["Games"])


@app.get("/status")
async def status() -> JSONResponse:
    return JSONResponse(status_code=200, content={"success": True})
