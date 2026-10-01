use serde::Deserialize;

/// Vitamins and minerals per gram of food (units in data/json/SCHEMA.md).
/// Each is None when the source doesn't report it.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct Micronutrients {
    pub vitamin_a:   Option<f64>, // µg RAE
    pub vitamin_c:   Option<f64>, // mg
    pub vitamin_d:   Option<f64>, // µg
    pub vitamin_e:   Option<f64>, // mg
    pub vitamin_k:   Option<f64>, // µg
    pub folate:      Option<f64>, // µg DFE
    pub vitamin_b12: Option<f64>, // µg
    pub vitamin_b6:  Option<f64>, // mg
    pub calcium:     Option<f64>, // mg
    pub iron:        Option<f64>, // mg
    pub magnesium:   Option<f64>, // mg
    pub potassium:   Option<f64>, // mg
    pub zinc:        Option<f64>, // mg
    pub phosphorus:  Option<f64>, // mg
    pub selenium:    Option<f64>, // µg
}

/// Adult daily values (US FDA Daily Values, 2016 label rule), in the same units as the fields.
const DAILY_VALUES: Micronutrients = Micronutrients {
    vitamin_a:   Some(900.0),
    vitamin_c:   Some(90.0),
    vitamin_d:   Some(20.0),
    vitamin_e:   Some(15.0),
    vitamin_k:   Some(120.0),
    folate:      Some(400.0),
    vitamin_b12: Some(2.4),
    vitamin_b6:  Some(1.7),
    calcium:     Some(1300.0),
    iron:        Some(18.0),
    magnesium:   Some(420.0),
    potassium:   Some(4700.0),
    zinc:        Some(11.0),
    phosphorus:  Some(1250.0),
    selenium:    Some(55.0),
};

impl Micronutrients {
    fn values(&self) -> [Option<f64>; 15] {
        [
            self.vitamin_a, self.vitamin_c, self.vitamin_d, self.vitamin_e, self.vitamin_k,
            self.folate, self.vitamin_b12, self.vitamin_b6,
            self.calcium, self.iron, self.magnesium, self.potassium, self.zinc,
            self.phosphorus, self.selenium,
        ]
    }

    /// Sum of each nutrient as a fraction of its daily value, per gram of food
    /// (1.0 = one full daily value). Missing nutrients add nothing.
    pub fn daily_value_fraction(&self) -> f64 {
        self.values().iter().zip(DAILY_VALUES.values())
            .map(|(amount, daily)| amount.unwrap_or(0.0) / daily.unwrap_or(f64::INFINITY))
            .sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_nutrients_add_nothing() {
        assert_eq!(Micronutrients::default().daily_value_fraction(), 0.0);
    }

    #[test]
    fn one_daily_value_counts_as_one() {
        let half_calcium_half_iron = Micronutrients { calcium: Some(650.0), iron: Some(9.0), ..Default::default() };
        assert!((half_calcium_half_iron.daily_value_fraction() - 1.0).abs() < 1e-9);
    }
}
