"""
data-pipeline/src — Python port of the food comparison data pipeline.

Builds two SQLite databases from JSON source files:
  - foods.vN.db          — the full relational source database
  - foods-normalized.vN  — the pre-computed normalized database consumed by the API

Entry point: run `python -m src.build_db` from services/data-pipeline/.
"""
