# test_db_connection.py - Test database connection
print("=== Testing Database Connection ===")

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path="C:/Users/north/guru/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"✅ DATABASE_URL loaded: {DATABASE_URL[:50]}...")

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

print("\nImporting asyncpg...")
import asyncpg

async def test_connection():
    """Test basic database connection and table listing."""
    try:
        print("\n🔌 Connecting to database...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected successfully!")
        
        # Test query
        result = await conn.fetchval("SELECT 1")
        print(f"✅ Test query successful! Result: {result}")
        
        # List all tables
        print("\n📊 Checking tables...")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        print(f"✅ Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table['table_name']}")
        
        # Check gurus table specifically
        print("\n👤 Checking gurus table...")
        guru_count = await conn.fetchval("SELECT COUNT(*) FROM gurus")
        print(f"✅ Gurus table has {guru_count} records")
        
        await conn.close()
        print("\n✅ Database connection test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Running async test...")
    asyncio.run(test_connection())
    print("\n=== Test Complete ===")
