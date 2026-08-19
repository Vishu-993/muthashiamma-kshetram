import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.environ.get("MONGO_URI")

# Define the client globally so Vercel can cache it across warm invocations
client = AsyncIOMotorClient(MONGO_URI)
db = client.temple_db  # replace with your DB name

# Export collections
pages_col = db.pages
poojas_col = db.poojas
activity_col = db.activity
