"""
lib/ — insert helpers and raw-type wrappers for the data pipeline.

Each insert_*.py module owns one insert() function for one table;
insert_foods_normalized/ is a package because the normalized rows need extra joins.
load_foods/ reads the JSON, and db_version.py / database_files.py handle the build output.
The types/ sub-package holds computation wrappers (RawFood, RawAnimal, etc.)
that calculate weighted averages before writing to the normalized database.
"""
