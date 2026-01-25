# check_gurus_columns.py - Check gurus table structure
import asyncio
from dotenv import load_dotenv
import asyncpg
import os

load_dotenv(dotenv_path="C:/Users/north/guru/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_columns():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("📋 Columns in 'gurus' table:\n")
    columns = await conn.fetch("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'gurus'
        AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    
    for col in columns:
        print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
    
    await conn.close()

asyncio.run(check_columns())
