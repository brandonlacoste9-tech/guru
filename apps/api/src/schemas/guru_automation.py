from __future__ import annotations
from typing import List, Optional, Union, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import uuid4

# ==========================================
# GURU AUTOMATION SCHEMA (v1)
# Mirrors browser-use primitives for 1:1 playback
# ==========================================


class AutomationBaseAction(BaseModel):
    """Base for all automation actions"""

    id: str = Field(default_factory=lambda: str(uuid4()))
    description: Optional[str] = None  # User-friendly description (e.g., "Click Login")
    model_config = ConfigDict(extra="forbid")


class NavigateAction(AutomationBaseAction):
    type: Literal["navigate"] = "navigate"
    url: str
    new_tab: bool = False


class ClickAction(AutomationBaseAction):
    type: Literal["click"] = "click"
    index: Optional[int] = None
    coordinate_x: Optional[int] = None
    coordinate_y: Optional[int] = None
    # Selector is useful for playback stability if index/coords fail
    selector: Optional[str] = None
    text_content: Optional[str] = None  # Text of the element clicked


class TypeTextAction(AutomationBaseAction):
    type: Literal["type_text"] = "type_text"
    index: int
    text: str
    clear: bool = False
    is_sensitive: bool = False  # If true, valid for credential injection


class ScrollAction(AutomationBaseAction):
    type: Literal["scroll"] = "scroll"
    amount: Optional[int] = None  # Pixels
    direction: Literal["up", "down"] = "down"


class WaitAction(AutomationBaseAction):
    type: Literal["wait"] = "wait"
    seconds: int


class ExtractAction(AutomationBaseAction):
    type: Literal["extract"] = "extract"
    query: str  # What to extract
    variable_name: str  # Where to store it in session state


class CustomPythonAction(AutomationBaseAction):
    type: Literal["custom"] = "custom"
    code: str  # Python code snippet for advanced logic


# Union of all possible actions
AutomationAction = Union[
    NavigateAction,
    ClickAction,
    TypeTextAction,
    ScrollAction,
    WaitAction,
    ExtractAction,
    CustomPythonAction,
]


class AutomationMetadata(BaseModel):
    author_id: str
    guru_persona: Optional[str] = None  # e.g., "Finance Guru"
    version: str = "1.0.0"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GuruAutomation(BaseModel):
    """
    The persistent representation of a taught skill.
    Stored in 'automations' table jsonb column.
    """

    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    description: str
    steps: List[AutomationAction]
    metadata: AutomationMetadata

    # Link to parent Guru (if part of a Guru)
    guru_id: Optional[str] = None

    # Trigger for autonomous execution (ScheduleTrigger serialized)
    trigger: Optional[Dict[str, Any]] = None

    # Input variables required for this automation (e.g., {"target_url": "str"})
    input_schema: Dict[str, str] = {}

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Login to LinkedIn",
                "description": "Navigates and enters credentials",
                "steps": [
                    {"type": "navigate", "url": "https://linkedin.com"},
                    {"type": "type_text", "index": 5, "text": "user@example.com"},
                    {"type": "click", "index": 10},
                ],
            }
        }
