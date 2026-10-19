//! Everything computed for a single food on its own: its Compare By divisor, nutrition score,
//! emissions, water, and the assembled row.

mod divisor;
mod emissions;
mod nutrition;
mod row;
mod water;

pub(super) use divisor::NormFactors;
pub(super) use row::compute_row;
