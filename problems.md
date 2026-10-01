# Known data and scoring problems

Open issues found while reviewing the food data (2026-10-01). Each food's `notes` field in
`data/json/foods/*.json` also mentions the problems that affect it. Fixed issues are logged in
`data/json/CORRECTIONS.md`.

## Double counting and inconsistent rules

- **Soybean oil + soy feed count soy land twice.** Soybean oil gets the whole soy field
  (soy yield × 18.3% oil), and animal feed rows also charge soy land for the soybean meal they
  eat. Meal is ~60% of soy's value, so soybean oil's land use is overstated.
- **Main oils mix two splitting rules.** Canola, soybean, sunflower, coconut and peanut oil
  charge the whole field to the oil for land, but their water (Mekonnen & Hoekstra) gives the
  meal/cake a value share. Land and water should use the same rule.
- **Rice starch + rice protein claim more than one rice field.** Rice starch takes ~all of the
  rice by weight (1.25 kg rice per kg), while rice protein from the same process takes a value
  share (1.8 kg rice per kg).
- **Cane field counted ~109%.** Cane sugar takes 100% of the field and molasses takes its
  value share (~9%) on top.
- **By-product rule is a choice.** Molasses, corn oil, rice protein and pea protein use a
  value split; main products take the whole field. Splitting by calories instead would make
  molasses score about like cane sugar.

## Wrong or questionable values

- **Pine nuts** are tagged `wild` but still have a yield (200 kg/ha), so they get land use and
  forest-clearing deaths. Brazil nuts and maple syrup (also wild) have no yield. Pick one rule.
- **Lamb feed** (4.5 kg corn, 1.2 kg soy, hay, alfalfa per kg) is Australian feedlot-finishing
  data, but most of the world's lamb is grass-fed. Feed cropland is probably overstated and
  grazing land understated.
- **Sorghum** uses a US yield (4.2 t/ha) for every region; world yields (Africa, India) are much
  lower. Water, pesticide and fertilizer have no documented derivation.
- **Chickpeas and black beans (US water)** are mostly modelled grey water from nitrogen runoff
  (chickpeas 10,157 L/kg US), odd for crops that fix their own nitrogen.
- **Oyster meat yield** is 0.10; a Pacific oyster study reports soft tissue at 14–17% of total
  weight. A higher yield would also change the bivalve shell ratio (5.53) used for mussels,
  oysters and clams.
- **Quinoa yield** (1.7 t/ha) looks high; FAOSTAT world quinoa is ~0.9–1.2 t/ha.
- **Barley** yield is grain with hull, but nutrition is dehulled (~10–15% land understated).
  Barley emissions (1.5) are unverified; Poore & Nemecek's barley row is per kg of beer.
- **Oats**: FAO's 55% rolled-oat conversion and Poore & Nemecek's implied ~73% disagree.
- **Sardines** list tuna as bycatch (0.1 kg per kg) with no derivation recorded.
- **Avocado** emissions (2.5) are labelled as a Poore & Nemecek category that isn't in the OWID
  dataset. Avocado, coconut and mango erosion/CO2-capture notes were copied from emissions notes.
- **Coconut** water (2,500 L/kg) and emissions (3.3) are rough estimates (confidence 2).
- **Cucumber** water uses 240 L/kg while Mekonnen & Hoekstra give 353.

## Missing data

- **Tuna**: no bycatch modelled (longline and purse-seine catch sharks, turtles, juveniles).
- **Octopus**: no bycatch modelled (much of the catch is trawled).
- **Duck**: no global emissions breakdown found; methane, N2O and CO2 are borrowed from chicken.
- **Millet emissions**: no study found; uses Poore & Nemecek 'Wheat & Rye' (1.57) at confidence 1.
- **Borrowed pesticide profiles** (confidence 2): cassava ← sweet potato, rye ← wheat,
  millet ← sorghum, fava beans ← peas, pineapple ← banana.
- **Old, US-only pesticide surveys**: beet sugar (2000), eggplant (2010, ~900 acres; South Asian
  eggplant is sprayed far more).
- **No US water values** for the 2026-10-01 additions (Mekonnen & Hoekstra Vol. 2 tables didn't
  parse); US falls back to world.
- **Soil erosion, tillage and CO2 capture** are empty for most of the 2026-10-01 additions.
- **Wild squirrel availability** (5 Gg) is a placeholder guess with no data (confidence 1).
- **Kale availability** is US-only (110 Gg); world supply is far larger, so kale is penalised.
- **Whey protein, cheddar, mozzarella, parmesan availability** are US-only, used for every region.
- **Yogurt availability** (68 Mt) is from a market report with no primary source.
- **Goat milk** reflects the world-average low-yield goat (~95 kg milk/yr). FAO's US goat yield
  (~100 kg/yr) looked unreliable and wasn't used. Commercial dairy goats (600–1,000 kg/yr) would
  score much better; goat cheese inherits this.
- **No goat, sheep, cattle or deer brain has been counted**; neuron counts are estimated from
  brain mass with the Kazu 2014 artiodactyl scaling (confidence 2).

## Weakly sourced older entries

- Many per-hectare values (erosion, pesticide totals, fertilizer, tillage, CO2 capture) on
  older entries have notes that cite the yield source instead of explaining the number:
  apple, banana, tomato, cucumber, potato, broccoli, sweet potato, wheat, rice, oats,
  walnuts, pistachios, hazelnuts, peanuts and others.
- Several values have empty notes: beef weight / meat yield / world grazing land, pork neuron
  count and weight, salmon weight, sweet potato yield and water, cashew/macadamia/pine nut
  values, sunflower seed values.
- Chicken and tuna `weight_kg` notes were copied from neuron-count notes.

## Scoring / model issues

- **Bee deaths saturate.** 69 crops show ~100% of bees on the field killed even at tiny doses
  (`pesticide_bee_hazard` ≈ 1.0), because the probit curve maxes out. Bees are a small share
  of harm next to other insects, so scores barely change, but the model is unrealistic.
- **Zero is scored as "perfect".** A food with exactly 0 land, water or harm gets the batch's
  best ratio × the zero-better multiplier. This boosts Brazil nuts, maple syrup, wild meat and
  seafood (0 land/water). Changing the best non-zero food also moves every zero food's score.
- **Missing data scored as a real number.** Missing pesticide data = 0 deaths (now caught by
  `check_plant_pesticides.py`); missing availability = worst possible. Consider skipping a
  measure when its data is missing instead.
- **Animal gas totals vs published totals.** The build warns for butter, whey protein,
  parmesan, egg (US) and honey: gases + feed don't match the published `emissions_per_kg`
  (different allocation methods in the source studies).
- **Captivity years are hard-coded per slug and miss many animals.** `captivity_years_for_slug`
  in `services/wasm-calculations/src/calculations/eco/intelligence.rs` has no entry for goat,
  duck, goat milk, goat cheese, cheddar, mozzarella, parmesan or whey protein, so their own
  captivity counts as 0 years (milk, yogurt and butter get 5). Consider moving it into the data.
- **Lifespans are hard-coded per slug too.** `lifespan_years_for_slug` defaults to 10 years for
  anything not listed (goat, duck, octopus, carp, catfish, the bivalves, cheeses…), and its
  `"shrimp"` key never matches the real slugs (`shrimp-wild`, `shrimp-farmed`).
- **Intelligence score rises as body weight falls.** It divides by weight^0.7, so a 17.7 g
  anchoveta (15.6 M neurons) scores ~233T per death vs ~174T for a 4.5 kg salmon (110 M neurons).
  Check that this is the intended direction.
- **Debug delay in the scorer.** `services/wasm-calculations/src/lib.rs` has a "temporary"
  50 ms busy-wait inside `score()`, so every slider change blocks the page for 50 ms.
