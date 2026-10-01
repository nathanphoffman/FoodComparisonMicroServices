import type { ColConfig, DataRegion, SliderValues } from './FoodTableTypes';
import { DEFAULT_FOOD_WEIGHTS } from './Sliders/WeightSliders';
import { DEFAULT_SCORE_PRIORITIES } from './Sliders/ScorePrioritySliders';
import { DEFAULT_LAND_TYPE_WEIGHTS } from './Sliders/LandTypeSliders';
import { DEFAULT_WIN_DAMPENING } from './Sliders/WinDampeningSlider';
import { DEFAULT_OVER_HUNTING } from './Sliders/OverHuntingSlider';
import { DEFAULT_OVER_GATHERING } from './Sliders/OverGatheringSlider';

// ── Column config ─────────────────────────────────────────────────────────────

export const COLUMN_CONFIG: ColConfig[] = [
    { key: 'name',             label: 'Food',                   defaultVisible: true,  mobileVisible: true  },
    { key: 'nutritionScore',   label: 'Nutrition Score',        defaultVisible: true,  mobileVisible: true  },
    { key: 'emissions',        label: 'CO₂e (kg / kg)',         defaultVisible: true,  mobileVisible: false },
    { key: 'landUse',          label: 'Land Use (m² / kg)',     defaultVisible: true,  mobileVisible: false },
    { key: 'directKill',       label: 'Direct Kill',            defaultVisible: true,  mobileVisible: false },
    { key: 'water',            label: 'Water (L / kg)',         defaultVisible: true,  mobileVisible: false },
    { key: 'captiveSentience', label: 'Captive Sentience Cost', defaultVisible: true,  mobileVisible: false },
    { key: 'sentientHarm',     label: 'Sentient Harm',          defaultVisible: true,  mobileVisible: false },
    { key: 'availability',     label: 'Availability (Gg)',      defaultVisible: true,  mobileVisible: false },
    { key: 'finalScore',       label: 'Improvement',            defaultVisible: true,  mobileVisible: true  },
];

// ── Data region ───────────────────────────────────────────────────────────────

export const DEFAULT_DATA_REGION: DataRegion = 'avg';

export const DATA_REGION_OPTIONS: { value: DataRegion; label: string }[] = [
    { value: 'world', label: 'World' },
    { value: 'us',    label: 'US' },
    { value: 'avg',   label: 'Average of World + US' },
];

// ── Slider values ─────────────────────────────────────────────────────────────

export const DEFAULT_SLIDER_VALUES: SliderValues = {
    weights:                    DEFAULT_FOOD_WEIGHTS,
    scorePriorities:            DEFAULT_SCORE_PRIORITIES,
    greenWaterWeight:           25,
    greyWaterWeight:            25,
    killMultiplier:             500,
    captivityMultiplier:        1,
    neuronExponent:             1.5,
    weightExponent:             0.70,
    finalIntelligenceExponent:  1.15,
    zeroBetterMultiplier:       1.5,
    landTypeWeights:            DEFAULT_LAND_TYPE_WEIGHTS,
    winDampening:               DEFAULT_WIN_DAMPENING,
    overHuntingFactor:          DEFAULT_OVER_HUNTING,
    overGatheringFactor:        DEFAULT_OVER_GATHERING,
    referenceSlug:              'chicken',
    mealIngredients:            [],
};
