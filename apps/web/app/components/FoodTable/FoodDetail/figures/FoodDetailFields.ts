// Which sourced fields back a figure, and the labels shown for them.

/** The food's source fields for a figure, expanding groups like 'feed:' in data order. */
export function matchFields(patterns: string[], available: string[]): string[] {
  const matched: string[] = [];

  for (const pattern of patterns) {
    const hits = pattern.endsWith(':')
      ? available.filter(field => field.startsWith(pattern))
      : available.filter(field => field === pattern);

    for (const hit of hits) if (!matched.includes(hit)) matched.push(hit);
  }

  return matched;
}

const FIELD_LABELS: Record<string, string> = {
  nutrition:                    'Nutrition',
  yield_kg_ha:                  'Yield (kg per ha)',
  yield_fraction:               'Edible share',
  cooked_weight_ratio:          'Cooked weight ratio (g cooked per g dry)',
  water_per_kg:                 'Water (L per kg)',
  green_water_per_kg:           'Green water — rain (L per kg)',
  blue_water_per_kg:            'Blue water — irrigation (L per kg)',
  grey_water_per_kg:            'Grey water — pollution dilution (L per kg)',
  emissions_per_kg:             'Published emissions (kg CO₂e per kg)',
  farm_gate_emissions_per_kg:   'Farm-gate emissions, used when fed to animals (kg CO₂e per kg)',
  processing_emissions_per_kg:  'Processing emissions (kg CO₂e per kg)',
  processing_water_per_kg:      'Processing water (L per kg)',
  pesticide_kg_ha:              'Pesticide use, all compounds (kg per ha)',
  neuron_count:                 'Neurons',
  weight_kg:                    'Body weight (kg)',
  lifetime_output_kg:           'Food produced per animal (kg)',
  offspring_deaths_per_animal:  'Offspring killed per animal',
  offspring_captivity_years:    'Offspring time in captivity (years)',
  pasture_ha_per_kg_output:     'Grazing land (ha per kg)',
  pasture_green_water_l_per_ha: 'Pasture rainwater (L per ha per year)',
  native_fraction:              'Share of grazing land that was native habitat',
  ch4_kg_per_kg_output:         'Methane (kg CH₄ per kg)',
  n2o_kg_per_kg_output:         'Nitrous oxide (kg N₂O per kg)',
  co2_kg_per_kg_output:         'Other CO₂ (kg per kg)',
  bycatch_amount:               'Bycatch (kg per kg landed)',
  availability_gg:              'Production (Gg per year)',
  wild_fish_kg_per_kg:          'Wild fish caught (kg per kg)',
  wild_fish_neuron_count:       'Neurons per wild fish',
  wild_fish_weight_kg:          'Weight per wild fish (kg)',
  wild_fish_lifespan_years:     'Wild fish lifespan (years)',
};

export function fieldLabel(field: string): string {
  const [group, name] = field.split(':');

  if (name != null) {
    if (group === 'feed')       return `Feed: ${name} (kg per kg)`;

    if (group === 'pesticide')  return `Pesticide: ${name} (kg per ha)`;

    if (group === 'ingredient') return `Ingredient: ${name} (kg per kg)`;
  }

  return FIELD_LABELS[field] ?? field.replaceAll('_', ' ');
}
