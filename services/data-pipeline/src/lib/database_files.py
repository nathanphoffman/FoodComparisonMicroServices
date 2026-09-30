"""
database_files.py — creates the in-memory SQLite databases and writes them to
data/db/ as versioned files, replacing the previous build.
"""

import sqlite3
from pathlib import Path

from ..paths import DATA_DIR


def make_empty_database(schema_path: Path) -> sqlite3.Connection:
    """Creates an in-memory SQLite database and applies the given schema."""
    connection = sqlite3.connect(":memory:", isolation_level=None)
    connection.executescript(schema_path.read_text(encoding="utf-8"))
    return connection


def write_databases(
    source_connection: sqlite3.Connection,
    normalized_connection: sqlite3.Connection,
    version: str,
) -> None:
    """Deletes old database files and writes the new versions to disk."""
    _delete_old_databases("foods.v")
    _delete_old_databases("foods-normalized.v")

    source_path     = DATA_DIR / f"foods.{version}.db"
    normalized_path = DATA_DIR / f"foods-normalized.{version}.db"

    source_path.write_bytes(bytes(source_connection.serialize()))         # type: ignore[arg-type]
    normalized_path.write_bytes(bytes(normalized_connection.serialize())) # type: ignore[arg-type]

    print(f"Built {source_path} ({source_path.stat().st_size:,} bytes)")
    print(f"Built {normalized_path} ({normalized_path.stat().st_size:,} bytes)")


def _delete_old_databases(filename_prefix: str) -> None:
    """Deletes all database files in DATA_DIR matching the given filename prefix."""
    for database_file in DATA_DIR.glob(f"{filename_prefix}*.db"):
        database_file.unlink()
