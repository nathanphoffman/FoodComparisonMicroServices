# Food JSON Schema Reference

This document describes the structure of every JSON file under `data/json/`.

---

## Top-level layout

```
data/json/
├── foods/
│   ├── index.json          # category → slug[] map
│   ├── meats.json
│   ├── seafood.json
│   ├── dairy.json
│   ├── eggs.json
│   ├── grains.json
│   ├── legumes.json
│   ├── feeds.json
│   ├── vegetables.json
│   ├── leafy.json
│   ├── fruits.json
│   ├── nuts.json
│   ├── seeds.json
│   └── oils.json
├── pesticides.json          # pesticide toxicity profiles
└── sources.json             # bibliography / citation registry
```

---

## Shared primitive: `SourcedValue`

Almost every numeric field in the schema is stored as an **array of sourced values** rather than a bare number.  This lets the pipeline take a weighted geometric mean across multiple independent measurements at build time.

```jsonc
[
  {
    "value": <number>,       // The measured quantity (units vary by field — see below)
    "confidence": <1–5>,     // How reliable this data point is:
                             //   5 = primary, high-quality source (e.g. USDA FDC)
                             //   4 = good secondary source
                             //   3 = reasonable estimate / modelled value
                             //   2 = rough / indirect derivation
                             //   1 = very uncertain / low-quality estimate
    "source": {
      "id":    <integer>,    // Foreign key into sources.json
      "url":   <string>,     // Canonical URL of the source document
      "title": <string>,     // Human-readable citation label
      "note":  <string|null> // Optional per-value derivation note
    }
  }
  // … additional independent measurements may follow
]
```

> **Why arrays?** When two credible sources give different values, both are stored.
> The build pipeline computes a confidence-weighted geometric mean at build time.
> A single-element array is the common case; `null` means "data not available".

---

## `sources.json`

Top-level bibliography registry.  Every `source.id` referenced inside a food file must exist here.

```jsonc
[
  {
    "id":    <integer>,      // Stable auto-increment ID — never reuse a retired id
    "url":   <string>,       // Unique canonical URL for the source
    "title": <string>,       // Short human-readable label used in notes / UI
    "notes": [               // Optional array of free-text notes about how this
      <string>               // source was used across different foods / fields
    ]
  }
]
```

---

## `pesticides.json`

One entry per named active ingredient.  Toxicity fractions are used at build time to compute
per-food pesticide hazard scores by joining against each plant's `pesticides[]` array.

```jsonc
[
  {
    "id":   <integer>,       // Stable ID — referenced by plant_pesticides join arrays
    "name": <string>,        // Common chemical name (e.g. "Glyphosate")

    // Potentially Affected Fraction (PAF) — all three are SourcedValue arrays
    "freshwater_paf": [...], // 0–1  USEtox PAF for aquatic freshwater organisms
    "terrestrial_paf": [...],// 0–1  USEtox PAF for soil organisms (nullable)
    "insect_paf": [...],     // 0–1  ECOTOX PAF for non-target arthropod community (nullable)

    // Raw toxicity endpoint — NOT a PAF; used to derive a separate bee-hazard score
    "bee_ld50": [...]         // µg active ingredient / bee  (PPDB acute oral LD50 for honeybee)
                              // Lower value = more toxic to bees
  }
]
```

---

## `foods/index.json`

Simple lookup that maps each category name to the slugs it contains.
Used by the pipeline to know which file to load and which entries to expect.

```jsonc
{
  "meats":      ["beef", "chicken", ...],
  "seafood":    ["salmon", "tuna", ...],
  "grains":     ["wheat", "corn", ...],
  // … one key per category file
}
```

---

## `foods/<category>.json`

Each file is a **JSON array of food objects**.  Every food has a shared base, then either
plant-specific or animal-specific fields depending on `type`.

---

### Base fields (all foods)

```jsonc
{
  "id":         <integer>,   // Stable auto-increment ID (matches the old SQL primary key)
  "slug":       <string>,    // URL-safe unique identifier, e.g. "black-beans"
  "name":       <string>,    // Display name, e.g. "Black Beans"
  "type":       "plant"|"animal",
  "category":   <string>,    // Category file the entry lives in (e.g. "grains", "meats")
  "human_food": 0|1,         // 1 = edible by humans; 0 = feed/forage crop only (e.g. alfalfa)
  "tags":       [<string>],  // Descriptive tags, e.g. ["meat","common"], ["fish"], ["nut"]

  // --- Nutrition (per gram of edible food as purchased) ---
  "nutrition": [
    {
      "value": {
        "calories":    <number>,  // kcal / g
        "fat":         <number>,  // g fat / g food
        "sat_fat":     <number>,  // g saturated fat / g food
        "protein":     <number>,  // g protein / g food
        "fiber":       <number>,  // g dietary fiber / g food
        "sodium":      <number>,  // mg sodium / g food  (note: milligrams, not grams)
        "carbs":       <number>,  // g carbohydrates / g food
        "sugar":       <number>,  // g sugar / g food
        "cholesterol": <number>,  // mg cholesterol / g food  (milligrams)
        "trans_fat":   <number>   // g trans fat / g food
      },
      "confidence": <1–5>,
      "source": { ... }
    }
  ]
}
```

---

### Plant-only fields

Plants get environmental impact data for crop production.

```jsonc
{
  // --- Yield ---
  "yield_fraction": [...],   // SourcedValue  0–1
                             // Fraction of the harvested weight that is edible.
                             // Accounts for peel, shell, pit, hull removal.
                             // 1.0 for foods already measured in edible-weight form (e.g. grain flour).

  "yield_kg_ha": [...],      // SourcedValue  kg / ha
                             // Crop yield: kilograms of harvested product per hectare per year.

  // --- Water footprint (Mekonnen & Hoekstra 2010 three-component breakdown) ---
  "water_per_kg": [...],     // SourcedValue  L / kg
                             // Total water footprint per kg of crop output
                             // (green + blue + grey combined).

  "green_water_per_kg": [...], // SourcedValue  L / kg
                             // Green water = rain-fed evapotranspiration consumed during growth.

  "blue_water_per_kg": [...],  // SourcedValue  L / kg
                             // Blue water = irrigation water withdrawn from surface/groundwater.

  "grey_water_per_kg": [...],  // SourcedValue  L / kg
                             // Grey water = freshwater required to dilute pollutants
                             //   (fertilizer runoff etc.) to safe levels.

  // --- Land & soil ---
  "soil_erosion": [...],     // SourcedValue  metric tons / ha / yr
                             // Soil lost to erosion under this crop.

  "tillage_events_per_year": [...], // SourcedValue  events / yr
                             // Number of mechanical tillage passes per growing season.
                             // Higher = more soil disturbance / carbon release.

  "co2_capture_kg_ha_yr": [...], // SourcedValue  kg CO₂ / ha / yr
                             // CO₂ captured by the standing crop (above-ground biomass
                             // sequestration during the growing season, before harvest).

  // --- Agrochemicals ---
  "pesticide_kg_ha": [...],  // SourcedValue  kg a.i. / ha
                             // Total active-ingredient pesticide applied per hectare.

  "fertilizer_kg_ha": [...], // SourcedValue  kg / ha
                             // Total fertilizer applied per hectare (all nutrient forms combined).

  "emissions_per_kg": [...], // SourcedValue  kg CO₂e / kg crop output
                             // Total greenhouse gas emissions from crop production
                             //   (fertilizer N₂O, farm energy, land-use change).
                             //   Source: Poore & Nemecek (2018) unless noted.

  // --- Per-pesticide breakdown ---
  "pesticides": [
    {
      "pesticide_id": <integer>, // FK into pesticides.json
      "name":         <string>,  // Denormalised name for readability
      "kg_ha": [...]             // SourcedValue  kg a.i. / ha for this specific compound
    }
  ]
}
```

---

### Animal-only fields

Animals get welfare metrics, pasture / water footprint, greenhouse gas components,
bycatch references, and feed composition.

```jsonc
{
  // --- Welfare ---
  "neuron_count": [...],     // SourcedValue  neurons (raw count)
                             // Estimated neuron count for the live animal — used as a
                             // proxy for sentience / welfare weighting.

  "weight_kg": [...],        // SourcedValue  kg
                             // Typical live body weight of the animal at slaughter.

  // --- Yield ---
  "yield_fraction": [...],   // SourcedValue  0–1
                             // Fraction of the live animal weight that becomes edible output.
                             // E.g. beef ~0.43 means 43% of the live-weight becomes retail cuts.

  // --- Bycatch (seafood only; null for land animals) ---
  "bycatch_food_id":   <integer|null>, // ID of the incidentally caught species
  "bycatch_food_slug": <string|null>,  // Slug of the bycatch species (denormalised)
  "bycatch_amount": [...],             // SourcedValue  kg bycatch / kg target output (nullable)
                                       // How many kg of bycatch are discarded per kg of the
                                       // target species landed.

  // --- Pasture land & water (grazing animals; null for aquaculture / poultry) ---
  "pasture_ha_per_kg_output": [...],       // SourcedValue  ha / kg output
                                           // Pasture area required to produce 1 kg of output.

  "pasture_green_water_l_per_ha": [...],   // SourcedValue  L / ha / yr
                                           // Green water (precipitation evapotranspiration)
                                           // consumed by the pasture type this animal grazes,
                                           // per hectare per year.
                                           // Combined with pasture_ha_per_kg_output at build
                                           // time to derive pasture green-water per kg output.

  "native_fraction": [...],                // SourcedValue  0–1
                                           // Fraction of that pasture land that was originally
                                           // native / natural habitat (biodiversity impact proxy).

  // --- Greenhouse gases (all three are raw gas masses, NOT CO₂-equivalent) ---
  "ch4_kg_per_kg_output": [...],   // SourcedValue  kg CH₄ / kg output
                                   // Methane from enteric fermentation + manure management.
                                   // Excludes: land-use change, feed-crop production.
                                   // Multiply by GWP100=28 for CO₂e.

  "n2o_kg_per_kg_output": [...],   // SourcedValue  kg N₂O / kg output
                                   // Nitrous oxide from manure management (direct + indirect).
                                   // Excludes: land-use change, feed-crop fertilizer.
                                   // Multiply by GWP100=265 for CO₂e.

  "co2_kg_per_kg_output": [...],   // SourcedValue  kg CO₂ / kg output
                                   // Direct CO₂ from on-farm energy, processing, transport.
                                   // Excludes: land-use change, feed-crop production
                                   //   (feed is tracked separately via the feed[] join below
                                   //   to avoid double-counting).

  // --- Feed composition ---
  "feed": [
    {
      "food_id":   <integer>,  // ID of the feed crop (must exist in foods/)
      "food_slug": <string>,   // Slug of the feed crop (denormalised for readability)
      "kg_feed_per_kg_output": [...] // SourcedValue  kg feed / kg animal output
                                     // How many kg of this specific crop the animal consumes
                                     // per kg of edible output produced.
    }
  ]
}
```

---

## Confidence scale

| Score | Meaning |
|-------|---------|
| 5 | High-quality primary source (e.g. USDA FDC, peer-reviewed paper with direct measurement) |
| 4 | Good secondary source or confirmed cross-check |
| 3 | Reasonable model / estimate (e.g. P&N 2018 global medians, FAO GLEAM) |
| 2 | Rough / indirect derivation; used when better data unavailable |
| 1 | Very uncertain; low-quality estimate or educated guess |

The build pipeline uses confidence scores as exponents in a weighted geometric mean.

---

## Units quick-reference

| Field | Unit |
|-------|------|
| `nutrition.calories` | kcal / g |
| `nutrition.fat`, `sat_fat`, `protein`, `fiber`, `carbs`, `sugar`, `trans_fat` | g / g food |
| `nutrition.sodium`, `nutrition.cholesterol` | mg / g food |
| `yield_fraction` | fraction 0–1 |
| `yield_kg_ha` | kg / ha |
| `water_per_kg`, `green_water_per_kg`, `blue_water_per_kg`, `grey_water_per_kg` | L / kg |
| `pasture_green_water_l_per_ha` | L / ha / yr |
| `soil_erosion` | metric tons / ha / yr |
| `pesticide_kg_ha`, `fertilizer_kg_ha`, `pesticides[].kg_ha` | kg a.i. / ha |
| `emissions_per_kg` | kg CO₂e / kg |
| `tillage_events_per_year` | events / yr |
| `co2_capture_kg_ha_yr` | kg CO₂ / ha / yr |
| `neuron_count` | neurons (raw integer count) |
| `weight_kg` | kg |
| `pasture_ha_per_kg_output` | ha / kg output |
| `bycatch_amount` | kg bycatch / kg target output |
| `ch4_kg_per_kg_output` | kg CH₄ / kg output (× GWP100 28 = CO₂e) |
| `n2o_kg_per_kg_output` | kg N₂O / kg output (× GWP100 265 = CO₂e) |
| `co2_kg_per_kg_output` | kg CO₂ / kg output |
| `kg_feed_per_kg_output` | kg feed / kg animal output |
| `freshwater_paf`, `terrestrial_paf`, `insect_paf` | fraction 0–1 (PAF) |
| `bee_ld50` | µg active ingredient / bee |
