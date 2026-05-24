"""
build_db.py — builds both SQLite databases from JSON source files.
Port of packages/data-pipeline/src/build-db.ts.
Run: python src/build_db.py
"""

import json
import re
import sqlite3
import sys
from pathlib import Path

from .food_types import Source, Pesticide
from .lib.load_foods import load_category_foods
from .lib.insert_sources import insert as insert_sources
from .lib.insert_foods import insert as insert_foods
from .lib.insert_animals import insert as insert_animals
from .lib.insert_plants import insert as insert_plants
from .lib.insert_pesticides import insert as insert_pesticides
from .lib.insert_plant_kills import insert as insert_plant_kills
from .lib.insert_plant_pesticides import insert as insert_plant_pesticides
from .lib.insert_animal_feed import insert as insert_animal_feed
from .lib.insert_foods_normalized import insert as insert_foods_normalized

# Root = MicroserviceArchitecture/ (self-contained — no parent references)
# src/ → data-pipeline/ → services/ → MicroserviceArchitecture/
ROOT     = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data" / "db"
JSON_DIR = ROOT / "data" / "json"
SQL_DIR  = ROOT / "data" / "sql"
WEB_CONFIG = ROOT / "apps" / "web" / "next.config.ts"


def bump_version() -> str:
    text = WEB_CONFIG.read_text(encoding="utf-8")
    match = re.search(r"DB_VERSION:\s*'v(\d+)'", text)
    if not match:
        raise RuntimeError("DB_VERSION not found in next.config.ts")
    next_ver = int(match.group(1)) + 1
    updated = re.sub(r"(DB_VERSION:\s*'v)\d+(')","\\g<1>" + str(next_ver) + "\\2", text)
    WEB_CONFIG.write_text(updated, encoding="utf-8")
    return f"v{next_ver}"


def delete_old_dbs(prefix: str) -> None:
    for f in DATA_DIR.glob(f"{prefix}*.db"):
        f.unlink()


def make_db(schema_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", isolation_level=None)
    conn.executescript(schema_path.read_text(encoding="utf-8"))
    return conn


def main() -> None:
    version = bump_version()
    print(f"Building version {version}…")

    source_conn     = make_db(SQL_DIR / "schema.sql")
    normalized_conn = make_db(SQL_DIR / "schema-normalized.sql")

    sources    = json.loads((JSON_DIR / "sources.json").read_text())
    pesticides = json.loads((JSON_DIR / "pesticides.json").read_text())
    data       = load_category_foods(JSON_DIR)

    # Tier 1 — no foreign keys
    insert_sources(source_conn, sources)
    insert_pesticides(source_conn, pesticides)
    # Tier 2
    insert_foods(source_conn, data.foods)
    # Tier 3
    insert_animals(source_conn, data.animals)
    insert_plants(source_conn, data.plants)
    # Tier 4
    insert_plant_kills(source_conn, data.plant_kills)
    insert_plant_pesticides(source_conn, data.plant_pesticides)
    insert_animal_feed(source_conn, data.animal_feed)
    # Tier 5 — normalized DB, must be last
    insert_foods_normalized(
        normalized_conn,
        foods=data.foods,
        plants=data.plants,
        animals=data.animals,
        plant_pesticides=data.plant_pesticides,
        pesticides=pesticides,
        animal_feed=data.animal_feed,
    )

    delete_old_dbs("foods.v")
    delete_old_dbs("foods-normalized.v")

    source_path     = DATA_DIR / f"foods.{version}.db"
    normalized_path = DATA_DIR / f"foods-normalized.{version}.db"

    source_path.write_bytes(bytes(source_conn.serialize()))         # type: ignore[arg-type]
    normalized_path.write_bytes(bytes(normalized_conn.serialize())) # type: ignore[arg-type]

    print(f"Built {source_path} ({source_path.stat().st_size:,} bytes)")
    print(f"Built {normalized_path} ({normalized_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
