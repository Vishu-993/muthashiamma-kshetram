import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.environ.get("MONGO_URI")

client = None
db = None
pages_col = None
poojas_col = None
activity_col = None

if MONGO_URI:
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client.get_default_database()
        pages_col = db["pages"]
        poojas_col = db["poojas"]
        activity_col = db["activity_log"]
    except Exception as e:
        print(f"Mongo init failed: {e}")
