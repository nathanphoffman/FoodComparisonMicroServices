"""
build_db.py — builds both SQLite databases from JSON source files.

Port of packages/data-pipeline/src/build-db.ts.
Run: python -m src.build_db  (from services/data-pipeline/)
"""

import json
import re
import sqlite3
import sys
from pathlib import Path

from .food_types import Source, Pesticide
from .lib.load_foods import load_category_foods, CategoryData
from .lib.insert_sources import insert as insert_sources
from .lib.insert_foods import insert as insert_foods
from .lib.insert_animals import insert as insert_animals
from .lib.insert_plants import insert as insert_plants
from .lib.insert_pesticides import insert as insert_pesticides
from .lib.insert_plant_kills import insert as insert_plant_kills
from .lib.insert_plant_pesticides import insert as insert_plant_pesticides
from .lib.insert_animal_feed import insert as insert_animal_feed
from .lib.insert_foods_normalized import insert as insert_foods_normalized

# Paths are derived from this file's location:
# build_db.py → src/ → data-pipeline/ → services/ → project root
ROOT       = Path(__file__).resolve().parents[3]
DATA_DIR   = ROOT / "data" / "db"
JSON_DIR   = ROOT / "data" / "json"
SQL_DIR    = ROOT / "data" / "sql"
WEB_CONFIG = ROOT / "apps" / "web" / "next.config.ts"

# Matches:  DB_VERSION: 'v77'
# Captures: the numeric version (e.g. "77") so it can be incremented.
DB_VERSION_READ_PATTERN = re.compile(r"DB_VERSION:\s*'v(\d+)'")

# Matches the full DB_VERSION assignment so the version number can be replaced in-place.
# Group 1 captures the prefix (DB_VERSION: 'v), group 2 captures the closing quote.
DB_VERSION_REPLACE_PATTERN = re.compile(r"(DB_VERSION:\s*'v)\d+(')")


def bump_version() -> str:
    """Reads DB_VERSION from next.config.ts, increments it, writes it back, and returns the new version string."""
    config_text = WEB_CONFIG.read_text(encoding="utf-8")
    version_match = DB_VERSION_READ_PATTERN.search(config_text)
    if not version_match:
        raise RuntimeError("DB_VERSION not found in next.config.ts")
    next_version_number = int(version_match.group(1)) + 1
    updated_config_text = DB_VERSION_REPLACE_PATTERN.sub(
        rf"\g<1>{next_version_number}\g<2>", config_text
    )
    WEB_CONFIG.write_text(updated_config_text, encoding="utf-8")
    return f"v{next_version_number}"


def make_empty_database(schema_path: Path) -> sqlite3.Connection:
    """Creates an in-memory SQLite database and applies the given schema."""
    connection = sqlite3.connect(":memory:", isolation_level=None)
    connection.executescript(schema_path.read_text(encoding="utf-8"))
    return connection


def delete_old_databases(filename_prefix: str) -> None:
    """Deletes all database files in DATA_DIR matching the given filename prefix."""
    for database_file in DATA_DIR.glob(f"{filename_prefix}*.db"):
        database_file.unlink()


def main() -> None:
    version = bump_version()
    print(f"Building version {version}…")

    source_connection     = make_empty_database(SQL_DIR / "schema.sql")
    normalized_connection = make_empty_database(SQL_DIR / "schema-normalized.sql")

    sources, pesticides, category_food_data = _load_json_data()
    _populate_source_database(source_connection, sources, pesticides, category_food_data)
    _populate_normalized_database(normalized_connection, pesticides, category_food_data)
    _write_databases(source_connection, normalized_connection, version)


def _load_json_data() -> tuple[list[Source], list[Pesticide], CategoryData]:
    """Loads sources, pesticides, and all category food data from JSON files."""
    sources: list[Source] = json.loads((JSON_DIR / "sources.json").read_text())
    pesticides: list[Pesticide] = json.loads((JSON_DIR / "pesticides.json").read_text())
    category_food_data = load_category_foods(JSON_DIR)
    return sources, pesticides, category_food_data


def _populate_source_database(
    connection: sqlite3.Connection,
    sources: list[Source],
    pesticides: list[Pesticide],
    category_food_data: CategoryData,
) -> None:
    """Inserts all records into the source database in dependency tier order."""
    # Tier 1 — no foreign keys
    insert_sources(connection, sources)
    insert_pesticides(connection, pesticides)
    # Tier 2
    insert_foods(connection, category_food_data.foods)
    # Tier 3
    insert_animals(connection, category_food_data.animals)
    insert_plants(connection, category_food_data.plants)
    # Tier 4
    insert_plant_kills(connection, category_food_data.plant_kills)
    insert_plant_pesticides(connection, category_food_data.plant_pesticides)
    insert_animal_feed(connection, category_food_data.animal_feed)


def _populate_normalized_database(
    connection: sqlite3.Connection,
    pesticides: list[Pesticide],
    category_food_data: CategoryData,
) -> None:
    """Inserts all pre-computed normalized rows into the normalized database."""
    insert_foods_normalized(
        connection,
        foods=category_food_data.foods,
        plants=category_food_data.plants,
        animals=category_food_data.animals,
        plant_pesticides=category_food_data.plant_pesticides,
        pesticides=pesticides,
        animal_feed=category_food_data.animal_feed,
    )


def _write_databases(
    source_connection: sqlite3.Connection,
    normalized_connection: sqlite3.Connection,
    version: str,
) -> None:
    """Deletes old database files and writes the new versions to disk."""
    delete_old_databases("foods.v")
    delete_old_databases("foods-normalized.v")

    source_path     = DATA_DIR / f"foods.{version}.db"
    normalized_path = DATA_DIR / f"foods-normalized.{version}.db"

    source_path.write_bytes(bytes(source_connection.serialize()))         # type: ignore[arg-type]
    normalized_path.write_bytes(bytes(normalized_connection.serialize())) # type: ignore[arg-type]

    print(f"Built {source_path} ({source_path.stat().st_size:,} bytes)")
    print(f"Built {normalized_path} ({normalized_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
