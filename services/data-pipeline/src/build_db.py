"""
build_db.py — builds both SQLite databases from JSON source files.

Port of packages/data-pipeline/src/build-db.ts.
Run: python -m src.build_db  (from services/data-pipeline/)
"""

import json
import sqlite3
import sys

from .food_types import Source, Pesticide
from .paths import JSON_DIR, SQL_DIR
from .lib.load_foods import load_category_foods, CategoryData
from .lib.db_version import bump_version
from .lib.database_files import make_empty_database, write_databases
from .lib.insert_sources import insert as insert_sources
from .lib.insert_foods import insert as insert_foods
from .lib.insert_animals import insert as insert_animals
from .lib.insert_plants import insert as insert_plants
from .lib.insert_pesticides import insert as insert_pesticides
from .lib.insert_plant_kills import insert as insert_plant_kills
from .lib.insert_plant_pesticides import insert as insert_plant_pesticides
from .lib.insert_animal_feed import insert as insert_animal_feed
from .lib.insert_composites import insert as insert_composites
from .lib.insert_foods_normalized import insert as insert_foods_normalized
from .lib.regions import REGIONS, resolve_regions
from .lib.check_animal_emissions import check_animal_emissions
from .lib.check_plant_pesticides import check_plant_pesticides


def main() -> None:
    version = bump_version()
    print(f"Building version {version}…")

    # Note: These are in memory connections,
    #  we do not actually write this to a file until the write_databases step
    source_connection     = make_empty_database(SQL_DIR / "schema.sql")
    normalized_connection = make_empty_database(SQL_DIR / "schema-normalized.sql")

    sources, pesticides, category_food_data = _load_json_data()
    _populate_source_database(source_connection, sources, pesticides, category_food_data)
    _populate_normalized_database(normalized_connection, pesticides, category_food_data)
    check_animal_emissions(normalized_connection, JSON_DIR, REGIONS)
    check_plant_pesticides(normalized_connection, REGIONS)
    write_databases(source_connection, normalized_connection, version)


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
    insert_composites(connection, category_food_data.composites, category_food_data.composite_ingredients)


def _populate_normalized_database(
    connection: sqlite3.Connection,
    pesticides: list[Pesticide],
    category_food_data: CategoryData,
) -> None:
    """Inserts all pre-computed normalized rows into the normalized database, once per region."""
    for region in REGIONS:
        region_food_data: CategoryData = resolve_regions(category_food_data, region)
        region_pesticides: list[Pesticide] = resolve_regions(pesticides, region)
        insert_foods_normalized(
            connection,
            foods=region_food_data.foods,
            plants=region_food_data.plants,
            animals=region_food_data.animals,
            plant_pesticides=region_food_data.plant_pesticides,
            pesticides=region_pesticides,
            animal_feed=region_food_data.animal_feed,
            region=region,
            composites=region_food_data.composites,
            composite_ingredients=region_food_data.composite_ingredients,
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
