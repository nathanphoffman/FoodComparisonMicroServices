/// Weighted power mean of the ratios with exponent `p`: p = 1 is the plain
/// (linear) average, where a 100× win in one measure dominates; p = 0 is the
/// geometric mean, where a 100× win exactly cancels a 100× loss; p = -1 is the
/// harmonic mean, where the weakest measure dominates.
pub(super) fn weighted_power_mean(weighted_ratios: &[(f64, f64)], total_priority: f64, p: f64) -> f64 {
    if p.abs() < 1e-9 {
        let weighted_log_sum: f64 = weighted_ratios.iter().map(|(ratio, priority)| ratio.ln() * priority).sum();
        return (weighted_log_sum / total_priority).exp();
    }
    let weighted_sum: f64 = weighted_ratios.iter().map(|(ratio, priority)| ratio.powf(p) * priority).sum();
    (weighted_sum / total_priority).powf(1.0 / p)
}

#[cfg(test)]
mod tests {
    use super::weighted_power_mean;

    // One measure 100× better, five equal, all equal priority.
    const RATIOS: [(f64, f64); 6] = [(100.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0), (1.0, 1.0)];

    #[test]
    fn power_mean_dampening() {
        let linear    = weighted_power_mean(&RATIOS, 6.0, 1.0);
        let geometric = weighted_power_mean(&RATIOS, 6.0, 0.0);
        let harmonic  = weighted_power_mean(&RATIOS, 6.0, -1.0);
        assert!((linear - 17.5).abs() < 1e-9);
        assert!((geometric - 100f64.powf(1.0 / 6.0)).abs() < 1e-9);
        assert!(harmonic < geometric && harmonic > 1.0);
        // near-zero p converges to the geometric mean
        assert!((weighted_power_mean(&RATIOS, 6.0, 1e-6) - geometric).abs() < 1e-4);
    }
}
