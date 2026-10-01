use serde::Deserialize;

/// Vitamins, minerals and omega-3 per gram of food (units in data/json/SCHEMA.md).
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
    pub ala:         Option<f64>, // g (omega-3 ALA)
    pub epa_dha:     Option<f64>, // mg (omega-3 EPA + DHA combined)
}

/// Adult daily values (US FDA Daily Values, 2016 label rule), in the same units as the fields.
/// Omega-3 has no FDA value: ALA uses the US NIH adequate intake (1.6 g), and
/// EPA + DHA the EFSA reference intake (250 mg).
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
    ala:         Some(1.6),
    epa_dha:     Some(250.0),
};

/// Nutrients most people fall short on count double: vitamin D, calcium and potassium
/// (the US Dietary Guidelines' nutrients of public health concern) and EPA + DHA.
const DOUBLE_CREDIT: Micronutrients = Micronutrients {
    vitamin_d: Some(2.0),
    calcium:   Some(2.0),
    potassium: Some(2.0),
    epa_dha:   Some(2.0),
    vitamin_a: None, vitamin_c: None, vitamin_e: None, vitamin_k: None, folate: None,
    vitamin_b12: None, vitamin_b6: None, iron: None, magnesium: None, zinc: None,
    phosphorus: None, selenium: None, ala: None,
};

impl Micronutrients {
    fn values(&self) -> [Option<f64>; 17] {
        [
            self.vitamin_a, self.vitamin_c, self.vitamin_d, self.vitamin_e, self.vitamin_k,
            self.folate, self.vitamin_b12, self.vitamin_b6,
            self.calcium, self.iron, self.magnesium, self.potassium, self.zinc,
            self.phosphorus, self.selenium, self.ala, self.epa_dha,
        ]
    }

    /// Sum of each nutrient as a fraction of its daily value, per gram of food
    /// (1.0 = one full daily value; 2.0 for the DOUBLE_CREDIT nutrients).
    /// Missing nutrients add nothing.
    pub fn daily_value_fraction(&self) -> f64 {
        self.values().iter().zip(DAILY_VALUES.values()).zip(DOUBLE_CREDIT.values())
            .map(|((amount, daily), credit)| {
                credit.unwrap_or(1.0) * amount.unwrap_or(0.0) / daily.unwrap_or(f64::INFINITY)
            })
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
        let half_zinc_half_iron = Micronutrients { zinc: Some(5.5), iron: Some(9.0), ..Default::default() };
        assert!((half_zinc_half_iron.daily_value_fraction() - 1.0).abs() < 1e-9);
    }

    #[test]
    fn shortfall_nutrients_count_double() {
        let one_calcium = Micronutrients { calcium: Some(1300.0), ..Default::default() };
        assert!((one_calcium.daily_value_fraction() - 2.0).abs() < 1e-9);
    }
}
