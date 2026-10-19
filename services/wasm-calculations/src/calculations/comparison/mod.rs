//! Everything that compares foods with each other: the Improvement score against the reference food,
//! the power mean that combines its measures, and the blends for custom foods (meal, diet).

mod final_score;
mod meal;
mod power_mean;
mod scoring;

pub(super) use final_score::Comparison;
pub(super) use meal::{synthesize, Blend};
