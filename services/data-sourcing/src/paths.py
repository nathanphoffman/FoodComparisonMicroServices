"""
paths.py — the project files the downloader reads from and writes to.

Paths are derived from this file's location:
paths.py → src/ → data-sourcing/ → services/ → project root
"""

from pathlib import Path

TEXT_ENCODING = "utf-8"
ROOT         = Path(__file__).resolve().parents[3]
SOURCES_JSON = ROOT / "data" / "json" / "sources.json"
OUTPUT_DIR   = ROOT / "data" / "sources"
