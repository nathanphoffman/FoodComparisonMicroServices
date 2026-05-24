"""
lib/ — insert helpers and raw-type wrappers for the data pipeline.

Each insert_*.py module owns one insert() function for one table.
The types/ sub-package holds computation wrappers (RawFood, RawAnimal, etc.)
that calculate weighted averages before writing to the normalized database.
"""
