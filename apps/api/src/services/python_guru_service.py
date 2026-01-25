"""
Python Guru Service - Database persistence for GuruOrchestrator executions.
"""
import asyncpg
import os
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class PythonGuruService:
    """Service to persist Guru execution data to Supabase."""
    
    def __init__(self):
        self.pool = None
    
    async def initialize(self):
        """Initialize the database connection pool."""
        if not DATABASE_URL:
            raise ValueError("DATABASE_URL not found in environment")
        
        self.pool = await asyncpg.create_pool(DATABASE_URL)
        print("✅ PythonGuruService: Database connection pool initialized")
    
    async def close(self):
        """Close the database connection pool."""
        if self.pool:
            await self.pool.close()
            print("🔒 PythonGuruService: Database connection pool closed")
    
    async def create_execution(
        self,
        guru_id: str,
        automation_id: str,
        triggered_by: str = "api"
    ) -> str:
        """
        Create a new guru execution record.
        Returns the execution_id (UUID).
        """
        async with self.pool.acquire() as conn:
            execution_id = await conn.fetchval(
                """
                INSERT INTO guru_executions (
                    guru_id,
                    automation_id,
                    triggered_by,
                    status,
                    started_at,
                    created_at
                )
                VALUES ($1, $2, $3, 'running', NOW(), NOW())
                RETURNING id
                """,
                guru_id,
                automation_id,
                triggered_by
            )
            print(f"📝 Created execution: {execution_id}")
            return str(execution_id)
    
    async def update_execution_success(
        self,
        execution_id: str,
        execution_time_ms: int
    ):
        """Mark execution as completed successfully."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE guru_executions
                SET status = 'completed',
                    execution_time_ms = $2,
                    completed_at = NOW()
                WHERE id = $1
                """,
                execution_id,
                execution_time_ms
            )
            print(f"✅ Execution {execution_id} marked as completed ({execution_time_ms}ms)")
    
    async def update_execution_failure(
        self,
        execution_id: str,
        error_message: str,
        execution_time_ms: int
    ):
        """Mark execution as failed with error message."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE guru_executions
                SET status = 'failed',
                    error_message = $2,
                    execution_time_ms = $3,
                    completed_at = NOW()
                WHERE id = $1
                """,
                execution_id,
                error_message,
                execution_time_ms
            )
            print(f"❌ Execution {execution_id} marked as failed: {error_message}")
    
    async def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve execution record by ID."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM guru_executions WHERE id = $1",
                execution_id
            )
            if row:
                return dict(row)
            return None
