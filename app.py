from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "db_connected": database.db is not None}

@app.get("/api/example")
async def example():
    try:
        db = database.get_db()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    # use db here
