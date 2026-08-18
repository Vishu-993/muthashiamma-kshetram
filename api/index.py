import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime
from fastapi import FastAPI, HTTPException, Header, Depends
from mangum import Mangum
from bson import ObjectId
import database
import auth

app = FastAPI()

def require_auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    payload = auth.verify_token(token)
    if not payload:
        raise HTTPException(401, "Invalid token")
    return payload

def require_owner(user=Depends(require_auth)):
    if user["role"] != "owner":
        raise HTTPException(403, "Owner only")
    return user

async def log_activity(user, action, target):
    await database.activity_col.insert_one({
        "user": user["sub"],
        "role": user["role"],
        "action": action,
        "target": target,
        "timestamp": datetime.utcnow()
    })

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/login")
async def login(body: dict):
    username = body.get("username")
    password = body.get("password")
    role = auth.authenticate(username, password)
    if not role:
        raise HTTPException(401, "Invalid credentials")
    token = auth.create_token(username, role)
    return {"token": token, "role": role, "username": username}

@app.get("/api/content/{page}")
async def get_content(page: str):
    doc = await database.pages_col.find_one({"_id": page})
    if not doc:
        return {"data": {}}
    return {"data": doc.get("data", {}), "updated_by": doc.get("updated_by"), "updated_at": doc.get("updated_at")}

@app.put("/api/content/{page}")
async def update_content(page: str, body: dict, user=Depends(require_auth)):
    data = body.get("data", {})
    await database.pages_col.update_one(
        {"_id": page},
        {"$set": {"data": data, "updated_by": user["sub"], "updated_at": datetime.utcnow()}},
        upsert=True
    )
    await log_activity(user, "update_content", page)
    return {"status": "saved"}

@app.get("/api/poojas")
async def list_poojas():
    items = []
    async for p in database.poojas_col.find().sort("order", 1):
        p["_id"] = str(p["_id"])
        items.append(p)
    return items

@app.post("/api/poojas")
async def add_pooja(body: dict, user=Depends(require_auth)):
    doc = {
        "name": body.get("name"),
        "amount": body.get("amount"),
        "order": body.get("order", 0),
        "updated_by": user["sub"],
        "updated_at": datetime.utcnow()
    }
    result = await database.poojas_col.insert_one(doc)
    await log_activity(user, "add_pooja", body.get("name"))
    return {"_id": str(result.inserted_id)}

@app.put("/api/poojas/{pooja_id}")
async def edit_pooja(pooja_id: str, body: dict, user=Depends(require_auth)):
    await database.poojas_col.update_one(
        {"_id": ObjectId(pooja_id)},
        {"$set": {
            "name": body.get("name"),
            "amount": body.get("amount"),
            "order": body.get("order", 0),
            "updated_by": user["sub"],
            "updated_at": datetime.utcnow()
        }}
    )
    await log_activity(user, "edit_pooja", pooja_id)
    return {"status": "updated"}

@app.delete("/api/poojas/{pooja_id}")
async def delete_pooja(pooja_id: str, user=Depends(require_auth)):
    await database.poojas_col.delete_one({"_id": ObjectId(pooja_id)})
    await log_activity(user, "delete_pooja", pooja_id)
    return {"status": "deleted"}

@app.patch("/api/poojas/{pooja_id}/done")
async def mark_pooja_done(pooja_id: str, body: dict, user=Depends(require_auth)):
    pooja = await database.poojas_col.find_one({"_id": ObjectId(pooja_id)})
    if not pooja:
        raise HTTPException(404, "Pooja not found")
    await log_activity(user, "pooja_done", pooja["name"])
    # TODO: send email to devotee with details (wire later)
    # TODO: trigger Razorpay payment confirmation flow (wire later)
    return {"status": "done", "pooja": pooja["name"]}

@app.get("/api/activity")
async def get_activity(user=Depends(require_owner)):
    items = []
    async for a in database.activity_col.find().sort("timestamp", -1).limit(50):
        a["_id"] = str(a["_id"])
        items.append(a)
    return items

@app.get("/api/debug-auth")
async def debug_auth():
    return {
        "jwt_secret_set": bool(os.environ.get("JWT_SECRET")),
        "admin1_user_set": bool(os.environ.get("ADMIN1_USERNAME")),
        "admin1_pass_set": bool(os.environ.get("ADMIN1_PASSWORD")),
        "admin1_role": os.environ.get("ADMIN1_ROLE", "not set"),
        "admin2_user_set": bool(os.environ.get("ADMIN2_USERNAME")),
        "admin3_user_set": bool(os.environ.get("ADMIN3_USERNAME")),
    }
    
handler = Mangum(app)
