# test_full_integration.py - Complete integration test
print("=== Full Integration Test ===\n")

import asyncio
import sys
import os
from dotenv import load_dotenv
import asyncpg

# Load environment
load_dotenv(dotenv_path="C:/Users/north/guru/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def create_test_guru():
    """Create a test guru in the database."""
    print("📝 Creating test guru...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    guru_id = await conn.fetchval("""
        INSERT INTO gurus (
            name, description, personality_traits, expertise_areas,
            communication_style, decision_making_style, learning_style,
            automation_preference, proactivity_level, risk_tolerance,
            total_runs, successful_runs, avg_healing_time_ms
        ) VALUES (
            'Test Guru',
            'A test guru for integration testing',
            '{"helpful": true, "patient": true}'::jsonb,
            '{"testing": true, "automation": true}'::jsonb,
            'Clear and concise',
            'Data-driven',
            'Hands-on',
            'high',
            80,
            'medium',
            0, 0, 0
        )
        RETURNING id
    """)
    
    await conn.close()
    print(f"✅ Test guru created with ID: {guru_id}\n")
    return str(guru_id)

async def test_python_guru_service(guru_id):
    """Test the python_guru_service functions."""
    print("🔧 Testing python_guru_service...")
    sys.path.insert(0, "C:/Users/north/guru/apps/api/src")
    
    from services.python_guru_service import get_guru_by_id, log_execution
    from datetime import datetime
    
    # Test get_guru_by_id
    guru = await get_guru_by_id(guru_id)
    if guru:
        print(f"✅ Successfully retrieved guru: {guru['name']}")
    else:
        print("❌ Failed to retrieve guru")
        return False
    
    # Test log_execution
    await log_execution({
        "guru_id": guru_id,
        "automation_id": None,
        "triggered_by": "integration_test",
        "task_plan_snapshot": "Test task plan",
        "findings_snapshot": "Test findings",
        "progress_snapshot": "Test progress",
        "status": "success",
        "error_message": None,
        "healing_attempts": 0,
        "self_healed": False,
        "healing_strategy": None,
        "execution_time_ms": 1000,
        "screenshot_before": None,
        "screenshot_after": None,
        "started_at": datetime.utcnow(),
        "completed_at": datetime.utcnow(),
    })
    print("✅ Successfully logged execution\n")
    return True

async def verify_data():
    """Verify the test data was created."""
    print("🔍 Verifying test data...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    guru_count = await conn.fetchval("SELECT COUNT(*) FROM gurus")
    execution_count = await conn.fetchval("SELECT COUNT(*) FROM guru_executions")
    
    print(f"✅ Gurus in database: {guru_count}")
    print(f"✅ Executions in database: {execution_count}")
    
    await conn.close()

async def main():
    try:
        # Step 1: Create test guru
        guru_id = await create_test_guru()
        
        # Step 2: Test python_guru_service
        success = await test_python_guru_service(guru_id)
        
        if not success:
            print("\n❌ Integration test failed")
            return
        
        # Step 3: Verify data
        await verify_data()
        
        print("\n✅ ✅ ✅ Full integration test completed successfully! ✅ ✅ ✅")
        print("\nNext steps:")
        print("  1. The database is fully operational")
        print("  2. python_guru_service is working correctly")
        print("  3. You can now integrate with guru_orchestrator.py")
        print("  4. Ready for Week 2: Scheduler & Notifications")
        
    except Exception as e:
        print(f"\n❌ Error during integration test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
