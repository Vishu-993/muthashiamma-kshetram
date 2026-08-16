from workers import WorkerEntrypoint
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import asgi

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
    env = request.scope.get("env")
    data = await request.json()
    
    try:
        # Example D1 SQL Query (Replaces your old MongoDB insert_one)
        # await env.DB.prepare("INSERT INTO donations (name, amount) VALUES (?1, ?2)").bind(data['name'], data['amount']).run()
        return JSONResponse({"status": "success", "message": "Database ready"})
    except Exception as e:
        return JSONResponse({"error": "Database error", "details": str(e)}, status_code=500)


# Main Cloudflare Worker Entrypoint
class Default(WorkerEntrypoint):
    async def fetch(self, request):
        return await asgi.fetch(app, request, self.env)
