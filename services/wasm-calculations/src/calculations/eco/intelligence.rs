#[derive(PartialEq)]
pub(super) enum PesticideVictim {
    Insect,
    Bee,
    Worm,
    Mammal,
    Bird,
    Reptile,
}

pub(super) struct VictimProfile {
    pub(super) victim: PesticideVictim,
    pub(super) neurons: f64,
    pub(super) weight_kg: f64,
    pub(super) lifespan_years: f64,
}

pub(super) const PROFILES: &[VictimProfile] = &[
    VictimProfile { victim: PesticideVictim::Insect,  neurons: 250_000.0, weight_kg: 1.2e-5,  lifespan_years: 0.17 },
    VictimProfile { victim: PesticideVictim::Bee,     neurons: 960_000.0,   weight_kg: 1e-4,  lifespan_years: 0.08 },
    VictimProfile { victim: PesticideVictim::Worm,    neurons: 500.0,       weight_kg: 3e-3,  lifespan_years: 5.0  },
    VictimProfile { victim: PesticideVictim::Mammal,  neurons: 7e7,         weight_kg: 0.02,  lifespan_years: 2.5  },
    VictimProfile { victim: PesticideVictim::Bird,    neurons: 1e8,         weight_kg: 0.05,  lifespan_years: 3.0  },
    VictimProfile { victim: PesticideVictim::Reptile, neurons: 1e6,         weight_kg: 0.05,  lifespan_years: 4.0  },
];

pub(super) fn compute_intelligence(
    neuron_count: f64,
    body_weight_kg: f64,
    lifespan: f64,
    neuron_exp: f64,
    weight_exp: f64,
    final_exp: f64,
) -> f64 {
    let neuron_score = neuron_count.powf(neuron_exp);
    let raw = neuron_score * lifespan / body_weight_kg.powf(weight_exp);
    raw.powf(final_exp)
}

pub(super) fn compute_pesticide_victim_intelligence(
    victim: PesticideVictim,
    neuron_exp: f64,
    weight_exp: f64,
    final_exp: f64,
) -> f64 {
    PROFILES.iter()
        .find(|p| p.victim == victim)
        .map_or(0.0, |p| compute_intelligence(p.neurons, p.weight_kg, p.lifespan_years, neuron_exp, weight_exp, final_exp))
}

/// Returns the typical lifespan in years for an animal food slug.
/// Used by both direct-kill and bycatch scoring to normalise kill impact.
pub(super) fn lifespan_years_for_slug(slug: &str) -> f64 {
    match slug {
        "beef" | "milk" | "yogurt" | "tuna" => 20.0,
        "chicken" | "egg" => 8.0,
        "pork" | "lamb" => 12.0,
        "turkey" => 10.0,
        "salmon" => 6.0,
        "shrimp" => 2.0,
        "sardines" => 4.0,
        _ => 10.0,
    }
}
