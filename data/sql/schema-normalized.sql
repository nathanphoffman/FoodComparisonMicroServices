CREATE TABLE IF NOT EXISTS foods_normalized (
    food_id   INTEGER NOT NULL,
    is_feed   INTEGER NOT NULL DEFAULT 0,  -- 0 = food itself, 1 = feed crop aggregate

    slug       TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL,            -- 'plant' | 'animal'
    tags       TEXT    NOT NULL,            -- json array of strings
    human_food INTEGER NOT NULL,            -- boolean

    -- nutrition averages (NULL for feed rows)
    calories                 REAL,
    fat                      REAL,
    sat_fat                  REAL,
    protein                  REAL,
    fiber                    REAL,
    sodium                   REAL,
    carbs                    REAL,
    sugar                    REAL,
    cholesterol              REAL,
    trans_fat                REAL,

    -- plant metrics (NULL for animal foods; populated for plant foods AND feed rows)
    yield_kg_ha              REAL,
    water_per_kg             REAL,
    green_water_per_kg       REAL,  -- green (rain-fed) component of water_per_kg; NULL if not yet sourced
    blue_water_per_kg        REAL,  -- blue (irrigation) component of water_per_kg; NULL if not yet sourced
    grey_water_per_kg        REAL,  -- grey (pollution-assimilation) component of water_per_kg; NULL if not yet sourced
    soil_erosion             REAL,
    pesticide_kg_ha          REAL,
    fertilizer_kg_ha         REAL,
    emissions_per_kg         REAL,
    tillage_events_per_year  REAL,
    co2_capture_kg_ha_yr     REAL,
    pesticide_freshwater_paf  REAL,  -- application-weighted average USEtox freshwater PAF (0-1) across all pesticides used on this crop
    pesticide_terrestrial_paf REAL,  -- application-weighted average USEtox terrestrial PAF (0-1), soil organisms
    pesticide_insect_paf      REAL,  -- application-weighted average ECOTOX non-target arthropod PAF (0-1), general insect community
    pesticide_bee_hazard      REAL,  -- application-weighted bee hazard score derived from bee_ld50 via inverse-weighted formula (higher = more hazardous);
                                     --   NOT a PAF and NOT an LD50 — it is a unitless relative hazard index computed as sum(kg_ha / bee_ld50) / total_kg_ha
    pesticide_kg_per_kg_food REAL,   -- total pesticide application intensity in kg active ingredient per kg food output (pesticide_kg_ha / yield_kg_ha)
    land_m2_per_kg           REAL,   -- for is_feed=1 rows: sum of (kg_feed_per_kg_output × 10000 / crop_yield_kg_ha) across all feed crops; NULL for plant food rows
    yield_fraction           REAL,  -- fraction of harvested weight that is edible (shell, peel, pit/seed loss etc.);
                                    --   1.0 for foods already measured in edible-weight form;
                                    --   applies to both plant and animal foods

    -- animal metrics (NULL for plant foods and feed rows)
    neuron_count             REAL,
    weight_kg                REAL,
    pasture_ha_per_kg_output     REAL,
    pasture_green_water_l_per_ha REAL,  -- green water (precipitation-fed evapotranspiration) consumed by the
                                        --   pasture type this animal grazes, in litres per hectare per year;
                                        --   NULL for animals without pasture
    native_fraction              REAL,
    bycatch_amount           REAL,
    ch4_kg_per_kg_output     REAL,  -- enteric fermentation + manure; excludes land use + feed
    n2o_kg_per_kg_output     REAL,  -- manure management; excludes land use + feed crop fertilizer
    co2_kg_per_kg_output     REAL,  -- on-farm energy, processing, transport; excludes land use + feed

    PRIMARY KEY (food_id, is_feed)
);
