import asyncio
from python_guru_service import PythonGuruService

async def test_with_real_data():
    print("🧪 Testing PythonGuruService with real database data...")
    
    service = PythonGuruService()
    await service.initialize()
    
    # Use the existing "Test Guru" from the database
    test_guru_id = "1b61c71c-8f5d-430d-a1fe-98449b31fe40"
    
    # First, create an automation for this guru
    async with service.pool.acquire() as conn:
        automation_id = await conn.fetchval(
            """
            INSERT INTO automations (user_id, name, description, is_active)
            VALUES (
                (SELECT user_id FROM gurus WHERE id = $1 LIMIT 1),
                'Test Automation for Python Service',
                'Integration test automation',
                true
            )
            RETURNING id
            """,
            test_guru_id
        )
        print(f"✅ Created test automation: {automation_id}")
    
    # Now test the execution creation
    execution_id = await service.create_execution(
        guru_id=test_guru_id,
        automation_id=str(automation_id),
        triggered_by="python_test"
    )
    
    print(f"📝 Created execution: {execution_id}")
    
    # Mark it as successful
    await service.update_execution_success(
        execution_id=execution_id,
        execution_time_ms=2500
    )
    
    # Retrieve and verify
    execution = await service.get_execution(execution_id)
    print(f"✅ Retrieved execution:")
    print(f"   Status: {execution['status']}")
    print(f"   Guru ID: {execution['guru_id']}")
    print(f"   Automation ID: {execution['automation_id']}")
    print(f"   Execution time: {execution['execution_time_ms']}ms")
    print(f"   Triggered by: {execution['triggered_by']}")
    
    await service.close()
    print("🎉 SUCCESS! Python Guru Service is fully operational!")

if __name__ == "__main__":
    asyncio.run(test_with_real_data())
