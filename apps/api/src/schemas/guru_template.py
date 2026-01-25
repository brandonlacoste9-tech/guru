from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import uuid4

from .guru import GuruCategory, GuruPersonality, ScheduleTrigger

# ==========================================
# GURU TEMPLATE SCHEMA - For Marketplace
# Pre-built Gurus that users can instantiate
# ==========================================


class TemplateReview(BaseModel):
    user_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TemplateCreator(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None
    verified: bool = False


class GuruTemplate(BaseModel):
    """
    A pre-built Guru template for the Marketplace.
    Users can browse, preview, and instantiate these.
    """

    model_config = ConfigDict(extra="forbid")

    # Identity
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    category: GuruCategory
    personality: GuruPersonality

    # Preview & Marketing
    preview_image: Optional[str] = None
    demo_video_url: Optional[str] = None
    tagline: Optional[str] = None

    # Included Automations (Serialized GuruAutomation objects)
    automation_templates: List[Dict[str, Any]] = []

    # Default Schedule (can be customized on instantiation)
    default_trigger: Optional[ScheduleTrigger] = None

    # Marketplace Stats
    downloads: int = 0
    rating: float = 0.0
    reviews: List[TemplateReview] = []

    # Pricing
    is_premium: bool = False
    price_monthly: Optional[float] = None  # USD, None = free

    # Creator
    creator: Optional[TemplateCreator] = None

    # Tags for discovery
    tags: List[str] = []

    # Status
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Job Hunt Guru",
                "description": "Applies to 50+ jobs per week automatically",
                "category": "career_business",
                "personality": "professional",
                "tagline": "Land your dream job on autopilot",
                "is_premium": False,
                "downloads": 23451,
                "rating": 4.9,
                "tags": ["career", "job search", "linkedin", "indeed"],
            }
        }
