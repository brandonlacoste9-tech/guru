from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import uuid4
from enum import Enum

# ==========================================
# GURU SCHEMA (v1) - The Wrapper
# A Guru is the user-defined "AI Chief of Staff"
# ==========================================


class GuruCategory(str, Enum):
    HEALTH_FITNESS = "health_fitness"
    CAREER_BUSINESS = "career_business"
    FINANCE = "finance"
    LEARNING = "learning"
    RELATIONSHIPS = "relationships"
    LIFESTYLE = "lifestyle"
    CUSTOM = "custom"


class GuruPersonality(str, Enum):
    MOTIVATOR = "motivator"  # "Let's crush it! 💪"
    ZEN_MASTER = "zen_master"  # "One step at a time 🙏"
    ANALYST = "analyst"  # "Here are your metrics 📊"
    PROFESSIONAL = "professional"  # "Task completed ✓"
    CUSTOM = "custom"  # User-defined


class ScheduleTriggerType(str, Enum):
    TIME = "time"  # Cron-like
    EVENT = "event"  # Webhook/API event
    CONDITION = "condition"  # When X happens
    MANUAL = "manual"  # User clicks "Run"


class ScheduleTrigger(BaseModel):
    type: ScheduleTriggerType
    cron: Optional[str] = None  # e.g., "0 6 * * 1-5" for weekdays at 6am
    time: Optional[str] = None  # e.g., "06:00"
    days: Optional[List[str]] = None  # e.g., ["mon", "tue", "wed"]
    timezone: str = "America/Toronto"
    event_type: Optional[str] = None  # For event-based triggers
    condition: Optional[str] = None  # For condition-based triggers


class NotificationChannel(str, Enum):
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"


class NotificationSettings(BaseModel):
    notify_on_start: bool = True
    notify_on_complete: bool = True
    notify_on_error: bool = True
    channels: List[NotificationChannel] = [NotificationChannel.PUSH]
    quiet_hours_start: Optional[str] = None  # e.g., "22:00"
    quiet_hours_end: Optional[str] = None  # e.g., "07:00"


class Guru(BaseModel):
    """
    A custom automation assistant - the core "Customize Your Guru" entity.
    Contains personality, triggers, and links to GuruAutomation objects.
    """

    model_config = ConfigDict(extra="forbid")

    # Identity
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str  # "Fitness Guru", "Job Hunt Guru", etc.
    description: str
    category: GuruCategory
    personality: GuruPersonality

    # Avatar & Branding
    avatar_url: Optional[str] = None
    accent_color: str = "#FFD700"  # Gold by default

    # Custom voice (if personality=CUSTOM)
    system_prompt: Optional[str] = None
    sample_messages: List[str] = []

    # Automation Links (IDs of GuruAutomation objects)
    automation_ids: List[str] = []

    # Scheduling
    trigger: Optional[ScheduleTrigger] = None
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)

    # Status
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # User ID

    # Analytics
    total_runs: int = 0
    successful_runs: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_run_at: Optional[datetime] = None

    # Marketplace (if shared)
    is_template: bool = False
    is_public: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Fitness Guru",
                "description": "Your personal fitness automation assistant",
                "category": "health_fitness",
                "personality": "motivator",
                "automation_ids": ["morning-routine-auto", "log-workout-auto"],
                "trigger": {
                    "type": "time",
                    "time": "06:00",
                    "days": ["mon", "tue", "wed", "thu", "fri"],
                },
            }
        }
