"""
shared.py — the pieces every record type is built from: a sourced number, nutrition values, and the nutrient lists.

TypedDicts, so they map cleanly to/from JSON without extra parsing.
"""

from typing import TypedDict, Literal, NotRequired

class SourcedNumber(TypedDict):
    value: float
    source_id: int
    confidence: int
    region: NotRequired[Literal["US", "world"]]  # optional; untagged values count as world

class NutritionValue(TypedDict):
    calories: float
    fat: float
    sat_fat: float
    protein: float
    fiber: float
    sodium: float | None
    carbs: float | None
    sugar: float | None
    cholesterol: float | None
    trans_fat: float | None

    # vitamins and minerals, per gram of food; absent when the source doesn't report them.
    # Units are in data/json/SCHEMA.md; the keys are listed in MICRONUTRIENT_KEYS.
    vitamin_a: NotRequired[float]
    vitamin_c: NotRequired[float]
    vitamin_d: NotRequired[float]
    vitamin_e: NotRequired[float]
    vitamin_k: NotRequired[float]
    folate: NotRequired[float]
    vitamin_b12: NotRequired[float]
    vitamin_b6: NotRequired[float]
    calcium: NotRequired[float]
    iron: NotRequired[float]
    magnesium: NotRequired[float]
    potassium: NotRequired[float]
    zinc: NotRequired[float]
    phosphorus: NotRequired[float]
    selenium: NotRequired[float]
    ala: NotRequired[float]      # omega-3 ALA, g / g food
    epa_dha: NotRequired[float]  # omega-3 EPA + DHA combined, mg / g food

    # amino acids, g per g of food; absent when the source doesn't report them (keys in AMINO_ACID_KEYS)
    tryptophan: NotRequired[float]
    threonine: NotRequired[float]
    isoleucine: NotRequired[float]
    leucine: NotRequired[float]
    lysine: NotRequired[float]
    methionine: NotRequired[float]
    cystine: NotRequired[float]
    phenylalanine: NotRequired[float]
    tyrosine: NotRequired[float]
    valine: NotRequired[float]
    arginine: NotRequired[float]
    histidine: NotRequired[float]
    alanine: NotRequired[float]
    aspartic_acid: NotRequired[float]
    glutamic_acid: NotRequired[float]
    glycine: NotRequired[float]
    proline: NotRequired[float]
    serine: NotRequired[float]

MICRONUTRIENT_KEYS = (
    "vitamin_a", "vitamin_c", "vitamin_d", "vitamin_e", "vitamin_k",
    "folate", "vitamin_b12", "vitamin_b6",
    "calcium", "iron", "magnesium", "potassium", "zinc", "phosphorus", "selenium",
    "ala", "epa_dha",
)

# All 18 amino acids USDA reports, g per g of food. The nine essential ones (histidine,
# isoleucine, leucine, lysine, methionine + cystine, phenylalanine + tyrosine, threonine,
# tryptophan, valine) drive the Nutrition score's protein-quality adjustment.
AMINO_ACID_KEYS = (
    "tryptophan", "threonine", "isoleucine", "leucine", "lysine", "methionine", "cystine",
    "phenylalanine", "tyrosine", "valine", "histidine",
    "arginine", "alanine", "aspartic_acid", "glutamic_acid", "glycine", "proline", "serine",
)

class SourcedNutrition(TypedDict):
    value: NutritionValue
    source_id: int
    confidence: int
