// One value per broad land type — a food's land split (fractions) or the Land Use
// slider weights (multipliers). Keys match the Rust LandTypes struct.
export type LandTypes = {
  tropical_forest:     number;
  tropical_savanna:    number;
  temperate_grassland: number;
  temperate_forest:    number;
  dry:                 number;
  wetland:             number;
};
