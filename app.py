from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

# Security headers for API responses
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Example Database Route: How you will save donations to Cloudflare D1
@app.post("/api/donations")
async def save_donation(request: Request):
    # Access the Cloudflare environment safely
    env = request.scope.get("env")
    if not env or not hasattr(env, "DB"):
        return JSONResponse({"error": "Database binding not found"}, status_code=500)
        
    data = await request.json()
    
    try:
        # Example D1 SQL Query
        # await env.DB.prepare("INSERT INTO donations (name, amount) VALUES (?1, ?2)").bind(data['name'], data['amount']).run()
        return JSONResponse({"status": "success", "message": "Database ready"})
    except Exception as e:
        return JSONResponse({"error": "Database error", "details": str(e)}, status_code=500)
