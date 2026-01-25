import asyncio
from dotenv import load_dotenv
import asyncpg
import os

load_dotenv(dotenv_path="C:/Users/north/guru/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_columns():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("📋 Columns in 'guru_executions' table:\n")
    columns = await conn.fetch("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'guru_executions'
        AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    
    for col in columns:
        print(f"  - {col['column_name']}: {col['data_type']}")
    
    await conn.close()

asyncio.run(check_columns())
