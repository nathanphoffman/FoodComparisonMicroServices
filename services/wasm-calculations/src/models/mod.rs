mod detail;

mod input;

mod output;

pub use input::{AminoAcids, Basis, Diet, FoodRow, FOOD_TYPE_ANIMAL, FOOD_TYPE_PLANT, LandTypes, NutritionWeights, ScoreInput, SliderQuery};
pub use detail::{
    EmissionsBreakdown, ImprovementDetail, ImprovementTerm, KillDetail, LandUseDetail, SentientHarmDetail,
    WaterDetail,
};

pub use output::ScoredRow;
