"""
GuruOrchestrator: The execution engine for "Customize Your Guru" platform.
Coordinates Guru runs using existing planning-with-files and self-healing systems.
"""

from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel

# Import schemas
from ..schemas.guru import Guru, ScheduleTrigger
from ..schemas.guru_automation import GuruAutomation

logger = logging.getLogger(__name__)


class GuruExecutionResult(BaseModel):
    """Result of a Guru execution run"""

    guru_id: str
    success: bool
    automations_run: int
    automations_succeeded: int
    automations_failed: int
    duration_ms: int
    started_at: datetime
    completed_at: datetime
    errors: List[str] = []
    self_healed: bool = False


class GuruOrchestrator:
    """
    Orchestrates the execution of Gurus and their automations.

    Uses:
    - Planning-with-files for memory across runs
    - Self-healing for error recovery
    - Browser-use for automation execution
    """

    def __init__(self, db_client=None, browser_use_client=None):
        """
        Initialize the orchestrator with required clients.

        Args:
            db_client: Database client for loading Gurus/Automations
            browser_use_client: Client to execute browser automations
        """
        self.db = db_client
        self.browser_client = browser_use_client

    async def run_guru(
        self, guru_id: str, user_context: Optional[Dict[str, Any]] = None
    ) -> GuruExecutionResult:
        """
        Execute all automations for a Guru.

        Args:
            guru_id: The ID of the Guru to run
            user_context: Optional context (e.g., user credentials, preferences)

        Returns:
            GuruExecutionResult with success/failure details
        """
        start_time = datetime.utcnow()
        errors = []
        automations_succeeded = 0
        automations_failed = 0
        self_healed = False

        try:
            # 1. Load the Guru
            guru = await self._load_guru(guru_id)
            if not guru:
                return GuruExecutionResult(
                    guru_id=guru_id,
                    success=False,
                    automations_run=0,
                    automations_succeeded=0,
                    automations_failed=0,
                    duration_ms=0,
                    started_at=start_time,
                    completed_at=datetime.utcnow(),
                    errors=["Guru not found"],
                )

            logger.info(f"🤖 Starting {guru.name} (ID: {guru_id})")

            # 2. Load all automations for this Guru
            automations = await self._load_automations(guru.automation_ids)

            # 3. Execute each automation
            for automation in automations:
                try:
                    result = await self._execute_automation(automation, user_context)
                    if result.get("success"):
                        automations_succeeded += 1
                        logger.info(f"✅ {automation.title} completed")
                    else:
                        automations_failed += 1
                        errors.append(
                            f"{automation.title}: {result.get('error', 'Unknown error')}"
                        )

                        # Attempt self-healing
                        healed = await self._attempt_self_heal(
                            automation, result.get("error")
                        )
                        if healed:
                            self_healed = True
                            automations_succeeded += 1
                            automations_failed -= 1
                            logger.info(f"🛡️ Self-healed: {automation.title}")

                except Exception as e:
                    automations_failed += 1
                    errors.append(f"{automation.title}: {str(e)}")
                    logger.error(f"❌ {automation.title} failed: {e}")

            # 4. Update Guru stats
            await self._update_guru_stats(
                guru_id, automations_succeeded, automations_failed
            )

            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            return GuruExecutionResult(
                guru_id=guru_id,
                success=automations_failed == 0,
                automations_run=len(automations),
                automations_succeeded=automations_succeeded,
                automations_failed=automations_failed,
                duration_ms=duration_ms,
                started_at=start_time,
                completed_at=end_time,
                errors=errors,
                self_healed=self_healed,
            )

        except Exception as e:
            logger.error(f"💥 Guru execution failed: {e}")
            return GuruExecutionResult(
                guru_id=guru_id,
                success=False,
                automations_run=0,
                automations_succeeded=0,
                automations_failed=1,
                duration_ms=0,
                started_at=start_time,
                completed_at=datetime.utcnow(),
                errors=[str(e)],
            )

    async def _load_guru(self, guru_id: str) -> Optional[Guru]:
        """Load a Guru from the database."""
        # TODO: Implement database loading
        # For now, return None (will be implemented with DB integration)
        logger.debug(f"Loading Guru: {guru_id}")
        return None

    async def _load_automations(
        self, automation_ids: List[str]
    ) -> List[GuruAutomation]:
        """Load automations from the database."""
        # TODO: Implement database loading
        logger.debug(f"Loading {len(automation_ids)} automations")
        return []

    async def _execute_automation(
        self, automation: GuruAutomation, user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a single automation using browser-use.

        Returns:
            Dict with 'success' and optionally 'error' or 'result'
        """
        # TODO: Integrate with browser-use Agent
        # This is the core execution logic that will call browser-use
        logger.info(f"Executing: {automation.title}")

        # Placeholder - actual implementation will use browser-use
        return {"success": True, "result": "Placeholder execution"}

    async def _attempt_self_heal(self, automation: GuruAutomation, error: str) -> bool:
        """
        Attempt to self-heal a failed automation.
        Uses the Self-Healing Sentinel from Phase 7.1.

        Returns:
            True if healed and automation succeeded on retry
        """
        # TODO: Integrate with self_healing.py
        logger.debug(f"Attempting self-heal for: {automation.title}")
        return False

    async def _update_guru_stats(
        self, guru_id: str, succeeded: int, failed: int
    ) -> None:
        """Update Guru analytics after a run."""
        # TODO: Implement database update
        logger.debug(
            f"Updating stats for Guru: {guru_id} (+{succeeded} succeeded, +{failed} failed)"
        )


# Singleton instance for use across the API
_orchestrator_instance: Optional[GuruOrchestrator] = None


def get_orchestrator() -> GuruOrchestrator:
    """Get the singleton GuruOrchestrator instance."""
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = GuruOrchestrator()
    return _orchestrator_instance
