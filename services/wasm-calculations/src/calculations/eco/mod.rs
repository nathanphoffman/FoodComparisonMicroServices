mod constants;
mod direct_kill;
mod intelligence;
mod land_use;
mod sentient_harm;

pub(super) use direct_kill::{
    compute_captive_sentience, compute_direct_kill, compute_kill_detail, wild_fish_deaths_per_kg,
};
pub(super) use land_use::compute_land_use;
pub(super) use sentient_harm::compute_sentient_harm;
