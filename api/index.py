import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from mangum import Mangum
import database

app = FastAPI()

@app.get("/api/health")
async def health():
    return {"status": "ok"}

handler = Mangum(app)
