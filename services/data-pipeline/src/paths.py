"""
paths.py — the project folders the pipeline reads from and writes to.

Paths are derived from this file's location:
paths.py → src/ → data-pipeline/ → services/ → project root
"""

from pathlib import Path

ROOT       = Path(__file__).resolve().parents[3]
DATA_DIR   = ROOT / "data" / "db"
JSON_DIR   = ROOT / "data" / "json"
SQL_DIR    = ROOT / "data" / "sql"
WEB_CONFIG = ROOT / "apps" / "web" / "next.config.ts"
