import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.environ["MONGO_URI"]
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()

pages_col = db["pages"]
poojas_col = db["poojas"]
activity_col = db["activity_log"]
