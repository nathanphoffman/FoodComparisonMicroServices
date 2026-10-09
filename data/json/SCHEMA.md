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
│   ├── oils.json
│   ├── sweeteners.json
│   ├── beverages.json      # drinks, stored per kg as drunk (e.g. brewed coffee)
│   └── composites.json     # foods made from other foods (see "Composite foods")
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

### Optional `region` tag

A SourcedValue may carry `"region": "US"` or `"region": "world"`.  Untagged values count as **world**.

```jsonc
"yield_kg_ha": [
  { "value": 790,  "confidence": 4, "source": { … FAO global … } },                 // world
  { "value": 2200, "confidence": 4, "region": "US", "source": { … USDA NASS … } }  // US
]
```

The pipeline builds `foods_normalized` once per region, and the UI has a dropdown to pick one:

| Region  | Values used |
|---------|-------------|
| `world` | Untagged / `"world"` values only |
| `us`    | `"US"` values; falls back to world values when the field has no US value |
| `avg`   | 50/50 mean of the world average and the US average |

Rules:
- Only add a US value where it **actually differs** from the world value (typically `yield_kg_ha`, the water fields, and animal emissions / pasture).  Nutrition, neuron counts, body weights etc. stay untagged.
- Never overwrite an existing world value with a US number — add a separate US-tagged entry next to it.
- Keep units and basis identical between the world and US entries (e.g. both dry weight, both shelled).
- For foods the US mostly imports (banana, mango, coconut, …), leave them world-only.

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

Each PAF is treated as the fraction of species affected at an application of 1 kg a.i./ha.
A crop's affected fraction scales each compound by its actual `kg_ha` (capped at 1) and
combines compounds as independent: `1 - Π(1 - min(1, paf × kg_ha / 1))`. So a light spray
counts for less than a heavy one; before 2026-09-28 it was a kg-weighted average, which
ignored the amount sprayed.

Bees use `bee_ld50` (acute oral, µg/bee) with US EPA (2014) Tier I defaults: a forager
takes in 28.6 µg per kg a.i./ha sprayed (98 µg/g in nectar and pollen × 0.292 g/day), so
RQ = 28.6 × kg_ha / LD50; mortality follows a probit curve with slope ~3.22 (EPA's RQ 0.4 ↔
10% mortality), 50% at the LD50. Compounds combine as independent. The result is the share
of the crop's bees killed (0-1), multiplied by bees per ha and ha per kg of food in scoring.

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

  // Plain-English summary for readers of how this food's numbers were derived:
  // where nutrition, yield, water, emissions and (for animals) neuron/weight/death
  // figures come from, any conversions (cooked ratio, milk-equivalent, value split),
  // proxies borrowed from other foods, past corrections (CORRECTIONS.md), and known
  // weak spots. Shown on the food's page (/foods/<slug>). Paragraphs are separated by
  // a blank line ("\n\n"). Don't include computed scores — they change with the sliders.
  // Update it whenever the food's data changes.
  "notes":      <string>,

  // Optional plain-English explanation shown in the Direct Kill, Captive
  // Sentience and Sentient Harm tooltips. Explain the reasoning (which animals
  // die, why, and where the per-animal numbers come from) for a reader with no
  // background. Do NOT include computed per-kg scores — the tooltip shows those
  // live, and they change with the sliders. Omit or null when not needed.
  "sentient_harm_explanation": <string|null>,

  // Optional. Ballpark split of the land this food is grown on (pasture + feed
  // crops for animals), as fractions summing to 1. Used to weight the Land Use
  // score by the "Land Use" sliders — does NOT affect land-driven deaths or
  // availability. Omit for foods with no farmland (seafood, wild foods).
  // Keys: tropical_forest, tropical_savanna, temperate_grassland,
  //       temperate_forest, dry, wetland
  "land_types": { "<key>": <number 0-1>, ... },
  // Optional. Plain-English reason for the land_types split.
  // Tags: "common" = shown by default; "milk" = listed under the Milks filter
  // in the food table, in addition to the food's own category. "meat-substitute"
  // also lists a food under Meat, "cheese-substitute", "ice-cream" and "milk" under Dairy & Eggs & Substitutes (Dairy & Eggs is animal products only), and
  // "vegan" under Vegan-Substitutes (only for products sold as vegan/allergy-aisle replacements, e.g. plant burgers, vegan cheese, non-dairy milks and ice cream — not ordinary foods that happen to be vegan).
  "land_types_note": <string>,

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
        "trans_fat":   <number>,  // g trans fat / g food

        // Vitamins, minerals and omega-3 — all optional. Leave a key out when the source doesn't
        // report it (it then adds nothing to the nutrition score). Use 0 only for a reported 0.
        // When the main source is missing some of these, add a second, lower-confidence
        // nutrition entry holding only the missing keys from a stand-in record (e.g. a close
        // species). Each field is averaged only over the entries that have it.
        "vitamin_a":   <number>,  // µg RAE / g food
        "vitamin_c":   <number>,  // mg / g food
        "vitamin_d":   <number>,  // µg / g food
        "vitamin_e":   <number>,  // mg alpha-tocopherol / g food
        "vitamin_k":   <number>,  // µg / g food
        "folate":      <number>,  // µg DFE / g food
        "vitamin_b12": <number>,  // µg / g food
        "vitamin_b6":  <number>,  // mg / g food
        "calcium":     <number>,  // mg / g food
        "iron":        <number>,  // mg / g food
        "magnesium":   <number>,  // mg / g food
        "potassium":   <number>,  // mg / g food
        "zinc":        <number>,  // mg / g food
        "phosphorus":  <number>,  // mg / g food
        "selenium":    <number>,  // µg / g food
        "ala":         <number>,  // g omega-3 ALA / g food (USDA 18:3 n-3; plain 18:3 when that isn't split out)
        "epa_dha":     <number>,  // mg omega-3 EPA + DHA combined / g food (USDA 20:5 n-3 + 22:6 n-3)

        // Amino acids — all optional, all in g of the amino acid per g of food (USDA SR nutrients 501–518).
        // Kept in their own nutrition entry (see below). The first eleven are the essential ones the
        // Nutrition score's protein-quality adjustment uses (methionine + cystine and phenylalanine +
        // tyrosine are compared together, as FAO does); the rest are shown in the nutrition tooltip.
        "tryptophan": <number>, "threonine": <number>, "isoleucine": <number>, "leucine": <number>,
        "lysine": <number>, "methionine": <number>, "cystine": <number>, "phenylalanine": <number>,
        "tyrosine": <number>, "valine": <number>, "histidine": <number>,
        "arginine": <number>, "alanine": <number>, "aspartic_acid": <number>, "glutamic_acid": <number>,
        "glycine": <number>, "proline": <number>, "serine": <number>
      },
      "confidence": <1–5>,
      "source": { ... }
    }
  ]
}
```

**Amino acids.** Each food with ≥ 1 g of protein per 100 g has a second `nutrition` entry holding only the 18 amino acid keys. It comes from the same USDA record as the main entry (confidence 5). Where USDA has no amino acid data for the record, the entry instead scales a close stand-in record's profile (mg per g of protein) to this food's protein (confidence 2–4, said in the note). Composites without a USDA amino acid record compute theirs from their ingredients' profiles, weighted by the protein each contributes (confidence 2). Foods with almost no protein (oils, sugars, tea, drinks) have none.

How it is scored (`amino_acids.rs`, `nutrition.rs`): for each of the nine essential requirements the food's mg per g of protein is divided by the FAO (2013) pattern for older children, adolescents and adults (histidine 16, isoleucine 30, leucine 61, lysine 48, methionine + cystine 23, phenylalanine + tyrosine 41, threonine 25, tryptophan 6.6, valine 40). The lowest ratio, capped at 1, is the amino acid score; the Protein Quality slider sets how much of that shortfall is taken off the protein points. Foods with any essential amino acid unreported are not penalised.

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

  "cooked_weight_ratio": [...], // SourcedValue  g cooked / g dry
                             // How much the food expands when cooked by weight.
                             // E.g. 2.5 means 1 kg dry → 2.5 kg cooked.
                             // Null / [] for foods consumed ready-to-eat (fruits, nuts, most veg).
                             // Used to reconcile dry-weight environmental data with cooked-weight
                             // nutritional data when comparing on a per-kg-as-eaten basis.
                             // The pipeline applies it to the food's own row: yield × ratio,
                             // water / emissions / pesticide-per-kg ÷ ratio. Feed calculations
                             // stay on the dry basis. If set, nutrition MUST be the cooked values.

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
                             // Poore & Nemecek values are cradle-to-RETAIL (they also include
                             //   processing, transport, packaging, retail and losses).

  "farm_gate_emissions_per_kg": [...], // SourcedValue  kg CO₂e / kg crop as fed to animals
                             // Crop emissions up to the farm gate, INCLUDING land-use change,
                             //   EXCLUDING processing, packaging, transport-to-retail, retail.
                             // Only needed for crops used as animal feed. The pipeline uses it
                             //   (instead of emissions_per_kg) when summing an animal's feed
                             //   emissions, so animals are not charged for retail stages their
                             //   feed never goes through. Falls back to emissions_per_kg if [].
                             // For processed feeds (soybean meal, fishmeal) include the milling /
                             //   reduction step, since the animal eats the processed product.

  // --- Wild fish killed (reduction-fishery products: fishmeal, fish oil) ---
  // Omit for every other plant. The pipeline also sums these over an animal's feed
  // (kg_feed_per_kg_output × wild_fish_kg_per_kg), so salmon etc. are charged for
  // the fish in their feed. Scored as DIRECT kill (fish caught on purpose).
  "wild_fish_kg_per_kg": [...],      // SourcedValue  kg whole wild fish killed / kg product
                             // Exclude the share made from trimmings of fish caught for food.
  "wild_fish_neuron_count": [...],   // SourcedValue  neurons of one source fish (e.g. anchoveta)
  "wild_fish_weight_kg": [...],      // SourcedValue  kg body weight of one source fish
  "wild_fish_lifespan_years": [...], // SourcedValue  years, used in the intelligence score

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

  "lifetime_output_kg": [...], // SourcedValue  kg
                             // Total food output produced per animal death.
                             // For single-slaughter animals (broilers, beef, pork):
                             //   leave as [] — the pipeline derives this as weight_kg × yield_fraction.
                             // For continuous-production animals (layer hens, dairy cows):
                             //   set explicitly to the total kg of food the animal produces
                             //   over its productive life before slaughter.
                             // Used by the direct-kill calculation to convert the per-animal
                             // intelligence score into a per-kg-output harm score.

  "offspring_deaths_per_animal": [...], // SourcedValue  count
                             // Offspring killed because this animal was kept in production,
                             // counted over its whole productive life. Leave as [] when none.
                             // Dairy: calves born to keep the cow lactating that are not
                             //   kept as herd replacements (sold for veal / beef).
                             // Layer hens: male chicks culled at the hatchery per hen raised.
                             // Offspring are scored as the same species as the parent
                             // (same neuron_count / weight_kg / lifespan), so no separate
                             // offspring neuron or weight fields exist.

  "offspring_captivity_years": [...], // SourcedValue  years
                             // Typical years each of those offspring spends in captivity
                             // before slaughter (veal calf ~0.5; culled chick ~0).
                             // Leave as [] when offspring_deaths_per_animal is [].

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
                                   // Emissions are computed as CO₂ + CH₄×28 + N₂O×265 + feed
                                   //   emissions, and the animal's emissions_per_kg is NOT used —
                                   //   so the three gas fields must not include feed-crop
                                   //   emissions (e.g. fertiliser N₂O), or they get counted twice.
                                   // The pipeline warns when that sum is far from emissions_per_kg.

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

### Composite foods (`composites.json`)

A composite is a food made from other foods in the dataset (e.g. a plant-based burger made
from soy, sunflower oil and coconut oil). Instead of plant fields, it lists its ingredients;
the pipeline sums the ingredients' crop impacts (the same math as an animal's `feed`) and
writes a normal plant-style row, so the API and scoring need nothing special.

`type` is `"plant"`, `category` is `"composites"`. Keep base fields and `nutrition` (from the
product label). Plant fields (`yield_kg_ha`, water, emissions …) are **not** set — they are
computed. `land_types` is optional: when omitted it is the land-area-weighted mix of the
ingredients' splits.

```jsonc
{
  "ingredients": [                       // weight fractions must sum to 1 (±0.02)
    {
      "food_slug": "soy",                // must be a plant food in another category file
      "fraction": [...],                 // SourcedValue  kg ingredient / kg product
      "base_kg_per_kg": [...]            // optional SourcedValue  kg base food / kg ingredient
                                         //   (default 1). Turns a processed ingredient back into
                                         //   its base food, e.g. soy protein concentrate → soybeans.
    },
    { "food_slug": null, "label": "water", "fraction": [...] }  // no crop footprint
  ],
  "processing_emissions_per_kg": [...],  // SourcedValue  kg CO₂e / kg product — factory energy,
                                         //   fermentation, packaging, non-crop inputs. Added on top
                                         //   of the ingredients' farm-gate crop emissions.
  "processing_water_per_kg": [...],      // SourcedValue  L / kg product — factory water, added to blue.
  "availability_gg": [...]               // the product's own world production (optional)
}
```

How the row is built (per kg of product):
- land m² = Σ fraction × base_kg_per_kg × 10,000 / ingredient yield_kg_ha; `yield_kg_ha` = 10,000 / land.
- water (green / blue / grey) and emissions = Σ ingredient kg × the ingredient's per-kg value
  (farm-gate emissions where set), plus the processing fields.
- per-hectare fields (erosion, fertilizer, tillage, CO₂ capture, pesticide kg/ha) and pesticide
  PAFs = land-area-weighted averages over the ingredients.
- `availability_gg` = √(own × ingredients), where ingredients = fraction-weighted average of each
  ingredient's world supply. A geometric mean because the two differ by orders of magnitude;
  falls back to whichever side exists.

Only plant ingredients are supported; animal ingredients are rejected at build time.

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
| `nutrition.vitamin_c`, `vitamin_e`, `vitamin_b6`, `calcium`, `iron`, `magnesium`, `potassium`, `zinc`, `phosphorus` | mg / g food |
| `nutrition.vitamin_a` (RAE), `vitamin_d`, `vitamin_k`, `folate` (DFE), `vitamin_b12`, `selenium` | µg / g food |
| `nutrition.ala` | g / g food |
| `nutrition.tryptophan` … `serine` (the 18 amino acids) | g / g food |
| `nutrition.epa_dha` | mg / g food |
| `yield_fraction` | fraction 0–1 |
| `cooked_weight_ratio` | g cooked / g dry |
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
