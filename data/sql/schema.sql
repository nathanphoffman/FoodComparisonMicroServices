/*
 * Food Comparison Database — Raw Schema
 *
 * PURPOSE
 * -------
 * Stores per-source environmental, nutritional, and toxicological data for
 * plant and animal foods. Every quantitative value is wrapped in a JSON array
 * of {value, source_id, confidence} objects so multiple sources can disagree
 * on the same metric without data loss.
 *
 * KEY DESIGN DECISIONS
 * --------------------
 * - JSON value arrays: columns typed TEXT hold arrays of
 *   {value: <number>, source_id: <int>, confidence: <0-1>} objects.
 *   This avoids a fully-normalised EAV schema while still tracking provenance
 *   and uncertainty for every data point.
 * - No migrations: the database is rebuilt from scratch on every run via
 *   scripts/build-db.ts. ALTER TABLE is never used; changes go directly in
 *   this file.
 * - Separate plant/animal tables: plants and animals have mostly disjoint
 *   metric sets; a single "foods" table with many NULLs would be noisier.
 * - Junction tables for feeds and kills: animal_feed and plant_animal_kills
 *   are many-to-many; storing them as junction rows keeps the per-food rows
 *   clean and allows multiple feed crops per animal.
 * - Pesticide toxicity is stored once per active ingredient (pesticides table)
 *   and linked to plants via plant_pesticides. The per-plant PAF/hazard values
 *   in foods_normalized are computed at build time by aggregating over
 *   plant_pesticides + pesticides weighted by kg_ha application rates.
 */

CREATE TABLE IF NOT EXISTS sources (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url   TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    notes TEXT  -- json array of note strings
);

CREATE TABLE IF NOT EXISTS foods (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    slug     TEXT    NOT NULL UNIQUE,
    name     TEXT    NOT NULL,
    type     TEXT    NOT NULL,
    nutrition TEXT   NOT NULL,  -- json array of {value: {calories, fat, sat_fat, protein, fiber, sodium, carbs, sugar, cholesterol, trans_fat}, source_id, confidence}
    human_food  INTEGER NOT NULL DEFAULT 1,  -- boolean: 1 = human food, 0 = feed/forage only
    tags        TEXT    NOT NULL DEFAULT '[]' -- json array of string tags, e.g. '["meat","common"]'
);

CREATE TABLE IF NOT EXISTS animals (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id           INTEGER REFERENCES foods(id),
    neuron_count      TEXT,
    weight_kg         TEXT,
    bycatch_animal_id        INTEGER REFERENCES animals(id),
    bycatch_amount           TEXT,
    yield_fraction           TEXT,  -- json array of {value: 0-1, source_id, confidence}
    pasture_ha_per_kg_output      TEXT,  -- json array of {value: ha/kg, source_id, confidence}
    pasture_green_water_l_per_ha  TEXT,  -- json array of {value: L/ha/yr, source_id, confidence}
                                         --   green water (precipitation-fed evapotranspiration) consumed by the
                                         --   pasture type this animal grazes, in litres per hectare per year;
                                         --   combined with pasture_ha_per_kg_output at build time to derive
                                         --   pasture green water per kg of output
    native_fraction               TEXT,  -- json array of {value: 0-1, source_id, confidence} — fraction of pasture on pre-existing native land
    ch4_kg_per_kg_output     TEXT,  -- json array of {value: kg CH4/kg output, source_id, confidence}
                                    --   includes: enteric fermentation, manure management
                                    --   excludes: land use change, feed production
    n2o_kg_per_kg_output     TEXT,  -- json array of {value: kg N2O/kg output, source_id, confidence}
                                    --   includes: manure management (direct + indirect)
                                    --   excludes: land use change, feed crop fertilizer
    co2_kg_per_kg_output     TEXT   -- json array of {value: kg CO2/kg output, source_id, confidence}
                                    --   includes: on-farm energy use, processing, transport
                                    --   excludes: land use change, feed production
);

CREATE TABLE IF NOT EXISTS plants (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    food_id          INTEGER REFERENCES foods(id),
    yield_kg_ha             TEXT,  -- json array of {value: kg/ha, source_id, confidence}
    yield_fraction          TEXT,  -- json array of {value: 0-1, source_id, confidence}; fraction of harvested weight that is edible
                                   --   (accounts for shell loss, peel loss, pit/seed removal, etc.);
                                   --   1.0 for foods already measured in edible-weight form
    water_per_kg            TEXT,  -- json array of {value: liters/kg, source_id, confidence}
    green_water_per_kg      TEXT,  -- json array of {value: L/kg, source_id, confidence}; green (rain-fed evapotranspiration) component of water_per_kg; Mekonnen & Hoekstra (2010)
    blue_water_per_kg       TEXT,  -- json array of {value: L/kg, source_id, confidence}; blue (irrigation) component of water_per_kg; Mekonnen & Hoekstra (2010)
    grey_water_per_kg       TEXT,  -- json array of {value: L/kg, source_id, confidence}; grey (pollution-assimilation) component of water_per_kg; Mekonnen & Hoekstra (2010)
    soil_erosion            TEXT,  -- json array of {value: tons/ha/yr, source_id, confidence}
    pesticide_kg_ha         TEXT,  -- json array of {value: kg/ha, source_id, confidence}
    fertilizer_kg_ha        TEXT,  -- json array of {value: kg/ha, source_id, confidence}
    emissions_per_kg        TEXT,  -- json array of {value: kg CO2e/kg, source_id, confidence}
    tillage_events_per_year TEXT,  -- json array of {value: events/yr, source_id, confidence}
    co2_capture_kg_ha_yr    TEXT   -- json array of {value: kg CO2/ha/yr, source_id, confidence}
);

CREATE TABLE IF NOT EXISTS plant_animal_kills (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id     INTEGER NOT NULL REFERENCES plants(id),
    animal_id    INTEGER NOT NULL REFERENCES animals(id),
    kills_per_ha TEXT    -- json array of {value: animals/ha, source_id}
);

CREATE TABLE IF NOT EXISTS animal_feed (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id            INTEGER NOT NULL REFERENCES animals(id),
    plant_id             INTEGER NOT NULL REFERENCES plants(id),
    kg_feed_per_kg_output  TEXT    NOT NULL   -- json array of {value: kg feed/kg output, source_id}
);

CREATE TABLE IF NOT EXISTS pesticides (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    freshwater_paf  TEXT    NOT NULL,  -- json array of {value: 0-1, source_id, confidence}; USEtox potentially affected fraction, aquatic freshwater organisms
    terrestrial_paf TEXT,              -- json array of {value: 0-1, source_id, confidence}; USEtox potentially affected fraction, soil organisms
    insect_paf      TEXT,              -- json array of {value: 0-1, source_id, confidence}; ECOTOX potentially affected fraction, non-target arthropod (general insect) community
    bee_ld50        TEXT               -- json array of {value: µg a.i./bee, source_id, confidence}; PPDB acute oral LD50 for honeybee; lower = more toxic
                                       -- NOTE: this is a raw toxicity endpoint, NOT a PAF; see pesticide_bee_hazard in foods_normalized for the derived hazard score
);

CREATE TABLE IF NOT EXISTS plant_pesticides (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id      INTEGER NOT NULL REFERENCES plants(id),
    pesticide_id  INTEGER NOT NULL REFERENCES pesticides(id),
    kg_ha         TEXT    -- json array of {value: kg/ha, source_id, confidence}
);
