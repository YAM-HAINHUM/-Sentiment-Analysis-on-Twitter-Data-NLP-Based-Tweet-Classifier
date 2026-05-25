import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.history.create_index("user_email")
    await db.history.create_index("user_id")
    await db.history.create_index("created_at")
    await db.history.create_index("model_used")
    await db.history.create_index("sentiment")
    await db.history.create_index([("created_at", -1), ("sentiment", 1)])
    logging.info(f"Connected to MongoDB: {settings.DATABASE_NAME} (Enhanced indexes for analytics)")


async def close_db():
    global client
    if client:
        client.close()
        logging.info("MongoDB connection closed")


def get_db():
    return db

