// ── Eco constants (matching FoodTableCalculations.ts exactly) ─────────────────
pub(super) const SQUARE_METERS_PER_HA: f64 = 10_000.0;

pub(super) const INSECT_DENSITY_PER_HA: f64 = 1e9;
pub(super) const INSECT_DEATH_FRACTION: f64 = 0.1;

pub(super) const BEE_DENSITY_PER_HA: f64 = 5_000.0;
// pesticide_bee_hazard is already the fraction of bees killed (0-1), computed in the
// data pipeline from EPA exposure and dose-response defaults, so it is not scaled again.

pub(super) const WORM_DENSITY_PER_HA: f64 = 500_000.0;
pub(super) const WORM_DEATH_FRACTION: f64 = 0.3;

pub(super) const CROPLAND_AGE_YEARS: f64 = 50.0;
pub(super) const PASTURE_AGE_YEARS: f64 = 30.0;

pub(super) const MAMMAL_DENSITY_PER_HA: f64 = 50.0;
pub(super) const BIRD_DENSITY_PER_HA: f64 = 5.0;
pub(super) const REPTILE_DENSITY_PER_HA: f64 = 50.0;
