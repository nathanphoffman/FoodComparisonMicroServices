export const MICRONUTRIENT_KEYS = [
  'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k', 'folate', 'vitamin_b12', 'vitamin_b6',
  'calcium', 'iron', 'magnesium', 'potassium', 'zinc', 'phosphorus', 'selenium', 'ala', 'epa_dha',
] as const;

export type MicronutrientKey = typeof MICRONUTRIENT_KEYS[number];

// Only the nutrients the source reports are present. Keys match the Rust Micronutrients struct.
export type Micronutrients = Partial<Record<MicronutrientKey, number>>;

// All 18 amino acids USDA reports, g per gram of food. The first eleven are the essential ones
// (methionine + cystine and phenylalanine + tyrosine are scored together); the rest are for display.
// Keys match the Rust AminoAcids struct.
export const AMINO_ACID_KEYS = [
  'histidine', 'isoleucine', 'leucine', 'lysine', 'methionine', 'cystine', 'phenylalanine', 'tyrosine', 'threonine', 'tryptophan', 'valine',
  'alanine', 'arginine', 'aspartic_acid', 'glutamic_acid', 'glycine', 'proline', 'serine',
] as const;

export type AminoAcidKey = typeof AMINO_ACID_KEYS[number];

export type AminoAcids = Partial<Record<AminoAcidKey, number>>;

// Nutrition sliders: points each nutrient adds to (or takes from) the Nutrition score.
// Matches the Rust NutritionWeights.
export type NutritionWeights = {
  protein:        number;  // per g (helps)
  fiber:          number;  // per g (helps)
  micronutrients: number;  // per full daily value of a vitamin/mineral (helps)
  satFat:         number;  // per g (harms)
  freeSugar:      number;  // per g of sugar beyond the fiber allowance (harms)
  sugarAllowance: number;  // g of sugar per g of fiber not counted as free sugar
  sodium:         number;  // per 100 mg (harms)
  proteinQuality: number;  // 0–1: share of the protein points lost at the worst amino acid shortfall (harms)
};

export type NutritionDetail = {
    calories:     number;
    fat:          number;
    saturatedFat: number;
    transFat:     number | null;
    cholesterol:  number | null;
    sodium:       number | null;
    carbs:        number | null;
    fiber:        number;
    sugar:        number | null;
    protein:      number;
    micronutrients: Micronutrients | null;
  aminoAcids:     AminoAcids | null;
};
