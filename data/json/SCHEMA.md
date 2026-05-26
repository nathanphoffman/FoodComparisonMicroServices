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
    "confidence": <1–5>,     // 1 (very uncertain) – 5 (high-quality primary source); see "Confidence scale"
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

---

## Conventions

### Wild-harvested and farmed variants

When a food has a clear wild-caught vs. farmed distinction, **two separate entries** are used rather than one blended entry.  The `name` field encodes the variant using a parenthetical suffix:

| Situation | Name format | Example |
|-----------|-------------|---------|
| Exclusively or overwhelmingly wild-harvested | `"<Food> (Wild)"` | `"Brazil Nuts (Wild)"`, `"Tuna (Wild)"` |
| Explicitly farmed / aquaculture | `"<Food> (Farmed)"` | `"Salmon (Farmed)"`, `"Shrimp (Farmed)"` |
| No meaningful wild/farmed distinction (mixed or averaged) | bare name | `"Almonds"`, `"Wheat"` |

The suffix is the only change needed — names flow through the pipeline and UI unchanged, so no schema, type, or query modifications are required when adding a new variant.

### Suppressing inapplicable metrics for wild-harvested plant foods

The plant environmental fields (`yield_kg_ha`, `water_per_kg`, and the green/blue/grey breakdown) are defined in terms of **managed cropland**.  For wild-harvested foods collected from native ecosystems that would exist regardless of harvest (e.g. Brazil nuts from Amazon rainforest), these metrics are both misleading and not applicable:

- `yield_kg_ha` drives the **land-use** display and the **crop deforestation** score in the UI.  A wild-harvested food has no cleared cropland, so this field should be left as an **empty array `[]`**.
- `water_per_kg`, `green_water_per_kg`, `blue_water_per_kg`, `grey_water_per_kg` represent agricultural water consumption models.  The native ecosystem consumes that water regardless of harvest.  Set all four to **`[]`** for wild-harvested plants.

Other plant fields (`pesticide_kg_ha: [{value: 0}]`, `fertilizer_kg_ha: [{value: 0}]`, `soil_erosion: [{value: 0}]`, `co2_capture_kg_ha_yr`) should still be populated — zero-input values and carbon sequestration are meaningful and correct for wild foods.

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
                             // ⚠ Set to [] for wild-harvested foods — suppresses land-use and
                             //   crop-deforestation displays, which assume cleared cropland.

  // --- Water footprint (Mekonnen & Hoekstra 2010 three-component breakdown) ---
  // ⚠ Set all four water fields to [] for wild-harvested foods (see Conventions).
  "water_per_kg": [...],     // SourcedValue  L / kg  (green + blue + grey combined)
  "green_water_per_kg": [...], // SourcedValue  L / kg  rain-fed evapotranspiration
  "blue_water_per_kg": [...],  // SourcedValue  L / kg  irrigation withdrawals
  "grey_water_per_kg": [...],  // SourcedValue  L / kg  dilution water for pollutant runoff

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
                             // Total GHG emissions from crop production
                             //   (fertilizer N₂O, farm energy, land-use change).

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

  // --- Bycatch (seafood only) ---
  "bycatch_food_id":   <integer|null>, // ID of the incidentally caught species
  "bycatch_food_slug": <string|null>,  // Slug of the bycatch species (denormalised)
  "bycatch_amount": [...],             // SourcedValue  kg bycatch / kg target output (nullable)
                                       // How many kg of bycatch are discarded per kg of the
                                       // target species landed.

  // --- Pasture land & water (grazing animals; null for aquaculture / poultry) ---
  "pasture_ha_per_kg_output": [...],       // SourcedValue  ha / kg output
                                           // Pasture area required to produce 1 kg of output.

  "pasture_green_water_l_per_ha": [...],   // SourcedValue  L / ha / yr
                                           // Green water on the pasture this animal
                                           // grazes, per hectare per year.

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
                                   // Excludes: land-use change, feed-crop production.

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
