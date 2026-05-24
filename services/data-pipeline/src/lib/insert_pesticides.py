import json
import sqlite3
from ..food_types import Pesticide


def _j(v): return json.dumps(v) if v else None


def insert(conn: sqlite3.Connection, pesticides: list[Pesticide]) -> None:
    for p in pesticides:
        conn.execute(
            "INSERT INTO pesticides (id, name, freshwater_paf, terrestrial_paf, insect_paf, bee_ld50) VALUES (?, ?, ?, ?, ?, ?)",
            (p["id"], p["name"], json.dumps(p["freshwater_paf"]),
             _j(p.get("terrestrial_paf")), _j(p.get("insect_paf")), _j(p.get("bee_ld50"))),
        )
