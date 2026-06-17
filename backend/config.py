from __future__ import annotations

import os
import secrets
import logging
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent


def _get_secret(env_var: str, file_fallback: str | None = None) -> str:
    """Resolve a secret: env var → local file → ephemeral random (dev only)."""
    val = os.environ.get(env_var)
    if val:
        return val
    if file_fallback and Path(file_fallback).exists():
        return Path(file_fallback).read_text().strip()
    ephemeral = secrets.token_hex(32)
    logger.warning(
        "Secret '%s' not set. Using ephemeral value — NOT safe for multi-instance deploys.",
        env_var,
    )
    return ephemeral


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # AI keys
    gemini_api_key: str = ""
    google_application_credentials: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # App
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    secret_key: str = ""

    # Rate limiting
    rate_limit_per_minute: int = 60

    # Storage paths
    chroma_persist_dir: str = str(BASE_DIR / "chroma_db")
    raw_data_dir: str = str(BASE_DIR / "data" / "raw")
    audio_data_dir: str = str(BASE_DIR / "data" / "audio")

    def model_post_init(self, __context):  # type: ignore[override]
        if not self.secret_key:
            object.__setattr__(
                self, "secret_key", _get_secret("SECRET_KEY", ".secret_key")
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Topic registry — single source of truth
TOPICS = [
    {
        "slug": "pocso-act",
        "name": "POCSO Act",
        "full_name": "Protection of Children from Sexual Offences Act, 2012",
        "icon": "shield",
        "source_url": "https://www.indiacode.nic.in/show-data?actid=AC_CEN_9_12_00002085_201232&sectionId=31749&sectionno=1&orderno=1",
    },
    {
        "slug": "consumer-protection-act",
        "name": "Consumer Protection Act",
        "full_name": "Consumer Protection Act, 2019",
        "icon": "scale",
        "source_url": "https://consumeraffairs.gov.in/public/upload/files/Consumer_Protection_Act_2019.pdf",
    },
    {
        "slug": "cyber-crime-laws",
        "name": "Cyber Crime Laws",
        "full_name": "Information Technology Act, 2000 (Cyber Crime Provisions)",
        "icon": "lock",
        "source_url": "https://www.indiacode.nic.in/show-data?actid=AC_CEN_23_1_00001999_200021&sectionId=13085&sectionno=1&orderno=1",
    },
    {
        "slug": "rti-act",
        "name": "Right to Information Act",
        "full_name": "Right to Information Act, 2005",
        "icon": "scroll",
        "source_url": "https://cic.gov.in/sites/default/files/Right%20to%20Information%20Act-2005_0.pdf",
    },
    {
        "slug": "gst-registration",
        "name": "GST Registration",
        "full_name": "Goods and Services Tax — Registration Provisions (CGST Act, 2017)",
        "icon": "receipt",
        "source_url": "https://cbic-gst.gov.in/cgst-act-2017.html",
    },
]

TOPIC_MAP: dict[str, dict] = {t["slug"]: t for t in TOPICS}
