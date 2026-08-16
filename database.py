"""
MongoDB connection wrapper.

Usage:
    from database import Database
    db = Database().db
    db.donations.insert_one({...})

Config via env vars only — never hardcode credentials in source.
    MONGO_URI      full connection string (mongodb+srv://user:pass@host/dbname)
    MONGO_DB_NAME  database name (default: temple_db)
"""
import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

logger = logging.getLogger(__name__)


class Database:
    """Singleton-style MongoDB connection holder."""

    _instance = None
    _client = None
    _db = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, uri: str | None = None, db_name: str | None = None):
        if self._client is not None:
            return  # already connected (singleton)

        uri = uri or os.environ.get("MONGO_URI")
        db_name = db_name or os.environ.get("MONGO_DB_NAME", "temple_db")

        if not uri:
            raise RuntimeError(
                "MONGO_URI not set. Add it to your .env file — never hardcode "
                "DB credentials in source."
            )

        try:
            self._client = MongoClient(
                uri,
                serverSelectionTimeoutMS=5000,   # fail fast, no hang
                connectTimeoutMS=5000,
                maxPoolSize=50,
                retryWrites=True,
            )
            # force connection check now, not on first query
            self._client.admin.command("ping")
        except (ConnectionFailure, ConfigurationError) as exc:
            logger.error("MongoDB connection failed: %s", exc)
            raise

        self._db = self._client[db_name]
        logger.info("Connected to MongoDB database '%s'", db_name)

    @property
    def db(self):
        return self._db

    def close(self):
        if self._client:
            self._client.close()
            Database._client = None
            Database._db = None
            Database._instance = None
