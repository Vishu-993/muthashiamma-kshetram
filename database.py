import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.environ["MONGO_URI"]
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()
