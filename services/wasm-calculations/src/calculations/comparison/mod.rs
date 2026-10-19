//! Everything that compares foods with each other: the Improvement score against the reference food,
//! the power mean that combines its measures, and the blended diet rows.

mod final_score;
mod blend;
mod power_mean;
mod scoring;

pub(super) use final_score::Comparison;
pub(super) use blend::{blend_diet, Blend};
