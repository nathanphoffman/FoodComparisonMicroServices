"""
category_keys.py — the category files to read, and which JSON fields belong to
the food, animal, plant and composite records.
"""

CATEGORY_FILES = [
    "beverages", "dairy", "eggs", "feeds", "fruits", "grains",
    "leafy", "legumes", "meats", "nuts", "oils",
    "seafood", "seeds", "sweeteners", "vegetables",
    # Must stay last: composites are built from foods in the other files.
    "composites",
]

FOOD_KEYS = {
    "id", "slug", "name", "type", "human_food", "tags", "nutrition", "availability_gg",
    "sentient_harm_explanation", "land_types", "category",
}

ANIMAL_KEYS = {
    "neuron_count", "weight_kg", "lifetime_output_kg", "bycatch_amount",
    "yield_fraction", "pasture_ha_per_kg_output", "pasture_green_water_l_per_ha",
    "native_fraction", "ch4_kg_per_kg_output", "n2o_kg_per_kg_output", "co2_kg_per_kg_output",
    "offspring_deaths_per_animal", "offspring_captivity_years",
}

PLANT_KEYS = {
    "yield_kg_ha", "yield_fraction", "water_per_kg",
    "green_water_per_kg", "blue_water_per_kg", "grey_water_per_kg",
    "soil_erosion", "pesticide_kg_ha", "fertilizer_kg_ha", "emissions_per_kg",
    "tillage_events_per_year", "co2_capture_kg_ha_yr", "cooked_weight_ratio",
    "farm_gate_emissions_per_kg",
    "wild_fish_kg_per_kg", "wild_fish_neuron_count", "wild_fish_weight_kg",
    "wild_fish_lifespan_years",
}

# A food with an "ingredients" list is a composite: its crop impacts are built from
# its ingredients, plus these processing extras. See data/json/SCHEMA.md.
COMPOSITE_KEYS = {"processing_emissions_per_kg", "processing_water_per_kg"}
