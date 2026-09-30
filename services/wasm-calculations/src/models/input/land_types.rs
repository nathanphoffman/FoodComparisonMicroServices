use serde::{Deserialize, Serialize};

/// One value per broad land type. Used both for a food's land split (fractions)
/// and for the Land Use slider weights (multipliers, 1.0 = neutral).
/// Keys are snake_case everywhere — food data, slider query and tooltip detail.
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct LandTypes {
    pub tropical_forest:     f64,
    pub tropical_savanna:    f64,
    pub temperate_grassland: f64,
    pub temperate_forest:    f64,
    pub dry:                 f64,
    pub wetland:             f64,
}

impl LandTypes {
    fn values(&self) -> [f64; 6] {
        [
            self.tropical_forest, self.tropical_savanna, self.temperate_grassland,
            self.temperate_forest, self.dry, self.wetland,
        ]
    }

    /// Weighted average of `weights` over this split. Returns 1.0 (neutral)
    /// for an empty split.
    pub fn multiplier(&self, weights: &LandTypes) -> f64 {
        let total: f64 = self.values().iter().sum();
        if total <= 0.0 {
            return 1.0;
        }
        let weighted: f64 = self.values().iter().zip(weights.values()).map(|(f, w)| f * w).sum();
        weighted / total
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::input::slider_query::default_land_type_weights;

    #[test]
    fn land_type_multiplier() {
        let weights = default_land_type_weights();

        let palm = LandTypes { tropical_forest: 0.85, wetland: 0.15, ..Default::default() };
        assert!((palm.multiplier(&weights) - 8.77).abs() < 1e-9);

        let wheat = LandTypes { temperate_grassland: 1.0, ..Default::default() };
        assert!((wheat.multiplier(&weights) - 0.45).abs() < 1e-9);

        // no split → neutral
        assert_eq!(LandTypes::default().multiplier(&weights), 1.0);

        // all weights at 1.0 → neutral regardless of split
        let ones = LandTypes {
            tropical_forest: 1.0, tropical_savanna: 1.0, temperate_grassland: 1.0,
            temperate_forest: 1.0, dry: 1.0, wetland: 1.0,
        };
        assert!((palm.multiplier(&ones) - 1.0).abs() < 1e-9);
    }
}
