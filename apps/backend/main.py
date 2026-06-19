from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):

    # startup
    yield
    # shutdown


app = FastAPI(lifespan=lifespan)


@app.get("/status")
async def status() -> JSONResponse:
    return JSONResponse(status_code=200, content={"success": True})
