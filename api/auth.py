import os
import time
import jwt

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGO = "HS256"

def get_admins():
    admins = []
    for i in (1, 2, 3):
        u = os.environ.get(f"ADMIN{i}_USERNAME")
        p = os.environ.get(f"ADMIN{i}_PASSWORD")
        r = os.environ.get(f"ADMIN{i}_ROLE", "admin")
        if u and p:
            admins.append({"username": u, "password": p, "role": r})
    return admins

def authenticate(username: str, password: str):
    for a in get_admins():
        if a["username"] == username and a["password"] == password:
            return a["role"]
    return None

def create_token(username: str, role: str) -> str:
    if not JWT_SECRET:
        raise ValueError("JWT_SECRET not configured")
    payload = {"sub": username, "role": role, "iat": int(time.time())}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def verify_token(token: str):
    if not JWT_SECRET:
        return None
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        return None
