"""
lib/ — the data pipeline's building blocks, one folder per job.

insert/ writes one table per module (foods/, sources/, impacts/), load_foods/ reads the JSON,
checks/ validates and warns, and database/ handles the build output (files, version, regions).
The types/ sub-package holds computation wrappers (RawFood, RawAnimal, etc.)
that calculate weighted averages before writing to the normalized database.
"""
