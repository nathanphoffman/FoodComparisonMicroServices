use serde::Deserialize;

/// Amino acids in grams per gram of food (units in data/json/SCHEMA.md).
/// Each is None when the source doesn't report it. All 18 are stored for display;
/// only the nine essential ones (histidine, isoleucine, leucine, lysine, methionine
/// + cystine, phenylalanine + tyrosine, threonine, tryptophan, valine) are scored.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct AminoAcids {
    pub tryptophan:    Option<f64>,
    pub threonine:     Option<f64>,
    pub isoleucine:    Option<f64>,
    pub leucine:       Option<f64>,
    pub lysine:        Option<f64>,
    pub methionine:    Option<f64>,
    pub cystine:       Option<f64>,
    pub phenylalanine: Option<f64>,
    pub tyrosine:      Option<f64>,
    pub valine:        Option<f64>,
    pub histidine:     Option<f64>,
    // Not essential, so not scored; kept so the food's full profile can be shown.
    pub arginine:      Option<f64>,
    pub alanine:       Option<f64>,
    pub aspartic_acid: Option<f64>,
    pub glutamic_acid: Option<f64>,
    pub glycine:       Option<f64>,
    pub proline:       Option<f64>,
    pub serine:        Option<f64>,
}

// FAO (2013) indispensable amino acid reference pattern for older children, adolescents
// and adults, in mg of amino acid per g of protein — what the body needs per gram of
// protein eaten. Keep in sync with AMINO_ACID_REQUIREMENTS in FoodTableCalculations.ts.
const HISTIDINE:                 f64 = 16.0;
const ISOLEUCINE:                f64 = 30.0;
const LEUCINE:                   f64 = 61.0;
const LYSINE:                    f64 = 48.0;
const METHIONINE_PLUS_CYSTINE:   f64 = 23.0;
const PHENYLALANINE_PLUS_TYROSINE: f64 = 41.0;
const THREONINE:                 f64 = 25.0;
const TRYPTOPHAN:                f64 = 6.6;
const VALINE:                    f64 = 40.0;

impl AminoAcids {
    /// Amino acid score (0–1): the food's weakest essential amino acid as a share of what the
    /// body needs, capped at 1. For each essential amino acid (methionine + cystine and
    /// phenylalanine + tyrosine counted together, as FAO does), the mg per g of protein is
    /// compared with the FAO reference pattern; the lowest of the nine ratios is the score
    /// (wheat is short on lysine and scores ~0.5; eggs and meat score 1).
    /// None when the food has no protein or any of the essential amino acids is unreported,
    /// so a food with incomplete data is never penalised.
    pub fn score(&self, protein_per_gram: f64) -> Option<f64> {
        if protein_per_gram <= 0.0 { return None; }
        let per_protein = |grams_per_gram: f64| grams_per_gram * 1000.0 / protein_per_gram;
        let sum = |first: Option<f64>, second: Option<f64>| Some(first? + second?);
        let ratios = [
            per_protein(self.histidine?)                                 / HISTIDINE,
            per_protein(self.isoleucine?)                                / ISOLEUCINE,
            per_protein(self.leucine?)                                   / LEUCINE,
            per_protein(self.lysine?)                                    / LYSINE,
            per_protein(sum(self.methionine, self.cystine)?)             / METHIONINE_PLUS_CYSTINE,
            per_protein(sum(self.phenylalanine, self.tyrosine)?)         / PHENYLALANINE_PLUS_TYROSINE,
            per_protein(self.threonine?)                                 / THREONINE,
            per_protein(self.tryptophan?)                                / TRYPTOPHAN,
            per_protein(self.valine?)                                    / VALINE,
        ];
        Some(ratios.iter().cloned().fold(f64::INFINITY, f64::min).min(1.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A protein that exactly meets every requirement (per gram of protein).
    fn complete(protein_per_gram: f64) -> AminoAcids {
        let g = |mg_per_g_protein: f64| Some(mg_per_g_protein / 1000.0 * protein_per_gram);
        AminoAcids {
            histidine: g(16.0), isoleucine: g(30.0), leucine: g(61.0), lysine: g(48.0),
            methionine: g(15.0), cystine: g(8.0), phenylalanine: g(25.0), tyrosine: g(16.0),
            threonine: g(25.0), tryptophan: g(6.6), valine: g(40.0),
            ..Default::default()
        }
    }

    #[test]
    fn a_protein_that_meets_every_requirement_scores_one() {
        assert!((complete(0.1).score(0.1).unwrap() - 1.0).abs() < 1e-9);
    }

    #[test]
    fn surplus_amino_acids_do_not_score_above_one() {
        let mut rich = complete(0.1);
        rich.lysine = rich.lysine.map(|v| v * 3.0);
        assert!((rich.score(0.1).unwrap() - 1.0).abs() < 1e-9);
    }

    #[test]
    fn the_weakest_amino_acid_sets_the_score() {
        let mut wheat_like = complete(0.1);
        wheat_like.lysine = wheat_like.lysine.map(|v| v * 0.5); // half the lysine needed
        assert!((wheat_like.score(0.1).unwrap() - 0.5).abs() < 1e-9);
    }

    #[test]
    fn methionine_and_cystine_count_together() {
        let mut low_methionine = complete(0.1);
        low_methionine.methionine = Some(0.0);
        // cystine alone is 8 of the 23 mg/g needed
        assert!((low_methionine.score(0.1).unwrap() - 8.0 / 23.0).abs() < 1e-9);
    }

    #[test]
    fn missing_data_or_no_protein_gives_no_score() {
        let mut partial = complete(0.1);
        partial.tryptophan = None;
        assert!(partial.score(0.1).is_none());
        assert!(complete(0.1).score(0.0).is_none());
        assert!(AminoAcids::default().score(0.1).is_none());
    }
}
