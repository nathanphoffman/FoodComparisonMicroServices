# Data Corrections Log

Newest first. Each entry says what was wrong, how it was found, what changed, and what is
still open. Per-value details live in the `note` of each SourcedValue (search for
`CORRECTION <date>`), in `sources.json` notes, and in `.claude/audit/food-*.txt`.

---

## 2026-10-01 — Bivalve body weights standardized for shell

### What was wrong

`weight_kg` for mussels, oysters and clams was whole live weight, shell on. Shells are a very
different share of each animal (oysters ~90% non-meat, clams ~83%, mussels ~73%), and the
intelligence score divides by body weight, so oysters looked far less sentient per animal
purely because of their heavy shells.

### What changed (seafood.json; notes start `CORRECTION 2026-10-01`)

Standardized body weight = meat weight × (1 + average non-meat:meat ratio of the three, 5.53),
so each carries the same shell burden relative to its soft body, like bone for mammals.
Non-meat = shell + intervalvular water, from each entry's existing meat yield.
`lifetime_output_kg` is now set to the real meat per animal so deaths per kg are unchanged.

| | Live (old) | Meat yield | Meat/animal | Non-meat:meat | weight_kg (new) |
|---|---|---|---|---|---|
| Mussels | 12 g | 0.27 | 3.24 g | 2.70 | 21.2 g |
| Oysters | 70 g | 0.10 | 7.00 g | 9.00 | 45.7 g |
| Clams | 16 g | 0.17 | 2.72 g | 4.88 | 17.8 g |

Scores (default sliders): oysters 2.79 → 2.64, mussels 2.27 → 2.45, clams 2.40 → 2.44.

### Still open

- Oyster meat yield 0.10 may be low: a Pacific oyster study reports soft tissue 14–17% of total
  weight (KSDB, Dev. Reprod. 25:67). A higher yield would lower the oyster ratio and the average.

---

## 2026-10-01 — Maple syrup: no land use (tapped native forest)

### What was wrong

Maple syrup had yield_kg_ha 425 (Quebec 1.71 kg syrup/tap × 250 taps/ha). The app turns any
yield into land use (~24 m²/kg, ~19× cane sugar) and into wildlife deaths from clearing that land,
but sugarbushes are not cleared or planted: FAO describes them as "maple stands of natural origin"
(second/third-growth forest, or maple that seeded itself on abandoned farmland). Planted maple
orchards exist only as an experimental method (University of Vermont, 2014).

### What changed

`yield_kg_ha` → `[]` and `land_types` removed (sweeteners.json; sources 446–447 added), the
same wild-harvest convention as Brazil nuts. Land use and clearing deaths are now zero.
Also tagged `wild`, so the Over-Gathering penalty applies (as for Brazil nuts).

### Still open

- Sugarbush management (thinning other species to favour maple, tubing, roads) is not counted.
- The app treats zero land use as "perfect", so maple syrup gets the zero-land bonus, as Brazil nuts do.
- Old yield basis kept here for reference: 1.71 kg/tap × 250 taps/ha = 425 kg/ha (sources 378–379).

---

## 2026-10-01 — Beet sugar land switched to the main-product rule

Beet sugar yield was beet yield × 132/865 (a value split from Mekonnen & Hoekstra), unlike cane
sugar and the oils, which charge the whole field to the main product. Now beet yield × FAO
extraction rate: world 13% (median of 38 countries) → 7,900 kg/ha (was 9,300); US 14% → 9,700
(was 10,600). Availability 41,391 → 35,261 Gg. Score 5.86 → 4.87 (default sliders). Water and
emissions unchanged (same basis as cane sugar). By-products (molasses, corn oil, rice protein,
pea protein) keep their value split.

---

## 2026-10-01 — Seven new crops had no pesticide data, scored as zero pesticide deaths

### What was wrong

Beet sugar, cassava, eggplant, fava beans, millet, pineapple and rye were added with empty
`pesticides` / `pesticide_kg_ha`. The scorer treats missing pesticide fractions as 0, so these
crops got no insect, bee or worm deaths, only habitat loss: their Sentient Harm was ~2,000×
lower than corn's. With six equally weighted measures that one huge "win" pushed beet sugar
(24.5) and cassava (16.1) above corn (11.4) even though corn beats them on most other measures.

### What changed (notes start `CORRECTION 2026-10-01`)

| Food | Pesticide data now from |
|---|---|
| beet-sugar | NASS 2000 sugarbeet survey (latest): 10.1 kg/ha, 4 compounds; fertilizer 234 kg/ha |
| eggplant | NASS 2010 eggplant survey (latest): 5.2 kg/ha, 2 compounds; fertilizer 354 kg/ha |
| cassava / rye / millet / fava-beans / pineapple | proxies, confidence 2: sweet-potato / wheat / sorghum / peas / banana |

New build warning `check_plant_pesticides.py`: any plant with cropland but no pesticide data (and
not explicitly `pesticide_kg_ha` = 0) is flagged.

### Result (default sliders, avg region, reference chicken)

| | Before | After |
|---|---|---|
| corn | 11.37 (#4) | 11.37 (#1) |
| beet-sugar | 24.47 (#1) | 5.86 |
| cassava | 16.14 (#2) | 4.40 |

### Still open

- Cassava, rye, millet, fava and pineapple use another crop's pesticide profile.
- Beet sugar and eggplant data are old, US-only surveys.

---

## 2026-09-24 — Grains: cooked nutrition compared with dry / paddy / wrong-product environment data

### What was wrong

- **Rice**: nutrition was cooked rice (1.3 kcal/g) but yield, water and emissions were per kg of
  *dry* rice, with no `cooked_weight_ratio` (same bug beans had). On top of that, yield was
  **paddy** (in-husk) while water and emissions were per kg **milled** rice, and emissions (2.7)
  was not the P&N value it cited — P&N/OWID rice is **4.45** per kg milled rice.
- **Quinoa**: same cooked-vs-dry mismatch as rice (1.2 kcal/g cooked, dry-seed environment data).
- **Oats**: nutrition is rolled oats, but yield/water were per kg oat grain *with hull*, and
  emissions 1.58 was P&N per kg oat grain (not a "Wheat & Rye grouping" as the note said).
- **Corn**: nutrition, yield and water are whole grain, but emissions 1.7 was per kg maize *meal*.
- **Barley**: 1.5 is not a P&N value (P&N barley is 1.18 per kg of *beer*); unverified.

### What changed (grains.json; notes start `CORRECTION 2026-09-24`)

| Food | Change |
|---|---|
| rice | `cooked_weight_ratio` 2.8 (FDC dry-matter); nutrition = FDC 168878 cooked; yield paddy → milled (world 4,700 → 3,055 ×0.65; US 8,482 → 6,107 ×0.72, FAO TCF); emissions 2.7 → 4.45 world; new US 1.47 (Brodt 2014, California, conf 2) |
| quinoa | `cooked_weight_ratio` 3.05; nutrition = FDC 168917 cooked |
| oats | yield 2,500 → 1,375 and water ÷0.55 (FAO TCF rolled-oat extraction); emissions 1.58 → 2.48 (P&N oatmeal) |
| corn | food `emissions_per_kg` 1.7 → 1.13 per kg grain. Feed uses `farm_gate_emissions_per_kg`, so feed is unchanged; yield/water untouched |
| wheat, barley, sorghum | values kept. Wheat: P&N per kg bread ≈ per kg grain (note added). Barley: confidence 3 → 2, notes corrected |

Sources 307–313 added.

### Result — rice per 1,000 kcal (pipeline values ÷ 1.3 kcal/g)

| | Before world | After world | Before US | After US |
|---|---|---|---|---|
| kg CO₂e | 2.08 | 1.22 | 2.08 (fell back to world) | 0.40 |
| Land m² | 1.64 | 0.90 | 0.91 | 0.45 |
| Water L | 1,923 | 687 | 1,615 | 577 |

### Still open

- Oats' conversion (FAO 0.55) and P&N's implied 0.73 kg oatmeal per kg oats disagree.
- Barley yield is grain with hull vs "Barley, hulled" nutrition (~10–15% understated); no
  sourced factor. Barley emissions has no per-kg-grain source.
- Quinoa world yield 1,700 kg/ha looks high (FAOSTAT is roughly 0.9–1.2 t/ha); not checked.
- US rice emissions is California-only and excludes packaging/retail/losses.

---

## 2026-09-24 — Dairy grazing land ~7× too low

### What was wrong

Milk land use = `pasture_ha_per_kg_output` (grazing) + feed-crop land from the feed rows.
Milk's pasture value was 0.0001 ha/kg (1 m²/kg), cited to Poore & Nemecek (source 55). That
is close to P&N's 10th-percentile milk farm (1.11 m²/L), not a typical value (mean 8.95,
median 2.1), and its note said it also covered feed cropland, which the feed rows already
count. The ~29% of the world dairy diet that is fresh grass was not counted as land anywhere.
Yogurt (×1.15) and butter (×8.2) inherited it. There was no US value.

### What changed (dairy.json; notes start `CORRECTION 2026-09-24`)

`pasture_ha_per_kg_output` is now grazing land only (permanent pasture/meadow):
- World 0.00066 ha/kg milk: P&N Data S2 "Global Totals" permanent pasture 6.275 m²/kg,
  rescaled from P&N's economic milk share (~87%) to the GLEAM ~0.92 share used by the gas and
  feed fields (source 297).
- US 0.0002 ha/kg milk: Eshel et al. 2014, ~20 Mha of US pasture for dairy ÷ 81.3 Mt milk
  = 2.46 m²/kg, × Pelton 81% milk allocation (source 298).
- Yogurt 0.00076 / 0.00023; butter 0.0054 / 0.0016 (world / US).

| Milk land use (m²/kg) | Grazing | Feed crops | Total |
|---|---|---|---|
| World before | 1.0 | 2.35 | 3.35 |
| World after | 6.6 | 2.35 | 8.95 (P&N mean 8.95) |
| US before (fell back to world) | 1.0 | 0.71 | 1.7 |
| US after | 2.0 | 0.71 | 2.7 |

### Still open

- **Pasture water is now much higher.** Pasture green water = pasture ha ×
  `pasture_green_water_l_per_ha` (6.5 million L/ha, i.e. 650 mm ET). Milk's pasture part goes
  from 650 to ~4,300 L/kg world and ~1,300 L/kg US. Mekonnen & Hoekstra 2012 give milk's
  whole green water footprint as 863 L/kg world and 647 L/kg US, including grazed grass. The
  650 mm/yr rate is plausible, but area × full ET counts all water evaporating from grazing
  land, not just the grass eaten. Beef and lamb use the same method, so this is a model
  question, not a milk value. Not changed.
- P&N's "permanent pasture" includes hay meadows, so it may partly overlap the grass-hay feed
  row (up to ~1 m²/kg world). P&N also say their pasture figures are biased low.
- The US value uses 2000–2010 data, and Eshel's dairy pasture has ±57% uncertainty.

---

## 2026-09-24 — Dairy emissions ~3× too high; animal feed charged at retail emissions

### How it was found

While checking why milk scored badly on emissions, the app's milk total (9.84 kg CO₂e/kg)
was compared to the published Poore & Nemecek (P&N) total already in the data (3.15). A
verification pass against FAO GLEAM, FAO 2010, P&N, Pelton et al. 2025/2026 and Thoma 2013
confirmed the gap and found the causes below.

Background: for animal foods the app does **not** use the published `emissions_per_kg`. It
computes `CO₂ + CH₄×28 + N₂O×265 + feed`, where feed = Σ kg feed per kg food × the crop's
emissions per kg (`services/wasm-calculations/src/calculations/emissions.rs`,
`services/data-pipeline/src/lib/types/raw_animal.py`). So an error in any gas or feed value
goes straight into the score, and nothing compared the result to the published total.

### What was wrong

| # | Problem | Effect |
|---|---|---|
| 1 | Milk CH₄ was 0.24 / 0.22 kg CH₄ per kg milk, attributed to P&N and GLEAM v3. Neither source supports it; published values are ~0.04–0.056 (world) and ~0.021 (US). Possibly FAO 2010's 2.4 kg CO₂e/kg with a slipped decimal (unconfirmed). | 6.4 kg CO₂e/kg from methane alone — twice milk's entire published footprint. |
| 2 | Milk N₂O was 0.004 kg/kg (~3× too high), and its note said it included feed-crop fertiliser N₂O, which the feed rows also count. | Over-count plus double count. |
| 3 | Milk CO₂ covered on-farm energy only; processing, transport, packaging and retail were missing (SCHEMA says this field includes them). | Milk was not comparable with other foods' cradle-to-retail totals. |
| 4 | Milk's feed ration was one Alberta high-yield ration (shares summed to 97%), used worldwide, with no silage or pasture, and charged 100% to milk. | Wrong feed amounts everywhere; no US difference. |
| 5 | Milk had no US-tagged gas or feed values. | The US view silently showed world numbers. |
| 6 | **Feed crops were charged at cradle-to-retail emissions.** The pipeline used each crop's food `emissions_per_kg` (P&N retail values — and per kg of *retail product*, e.g. maize **meal**, **bread**, tofu) instead of per kg of crop at the farm gate. | Every farmed animal was charged for processing/packaging/retail stages its feed never goes through. |
| 7 | Several feed-crop source notes were wrong or unverifiable: corn/wheat labelled "farm gate" (they are retail), soy 3.0 and sorghum 1.4 not traceable to P&N, fishmeal ~10–20× too high (assumed 0.9–1.2 kg CO₂e per kg fish landed; measured 0.09–0.11), source 75's URL points to a different paper. | Unreliable feed emissions. |
| 8 | Yogurt and butter were derived from milk's gas and feed values, inheriting all of the above. Yogurt had a redundant "midpoint" CH₄ entry (average of its other two) that double-weighted them. | Yogurt 11.3 (published ~3.6); butter 80.7 (published ~9–20). |

### What changed

**Pipeline / schema**
- New plant field `farm_gate_emissions_per_kg` (SCHEMA.md): crop emissions to the farm gate
  including land-use change, excluding processing/packaging/retail. The pipeline uses it for
  animal feed and falls back to `emissions_per_kg` (`RawPlant.feed_emissions_per_kg`).
- New build check `services/data-pipeline/src/lib/check_animal_emissions.py`: after building,
  warns when an animal's `gases + feed` total is more than 1.5× off its published
  `emissions_per_kg`. It prints warnings only; the build still succeeds.
- SCHEMA.md now says the gas fields must not include feed-crop emissions.

**Feed crops**: `farm_gate_emissions_per_kg` added, world / US (kg CO₂e per kg as fed):

| Crop | Old value used for feed | New world / US |
|---|---|---|
| corn | 1.7 | 0.79 / ~0.27 |
| wheat | 1.57 | 0.95 / 0.37 |
| sorghum | 1.4 | 0.91 / 0.25 |
| soy (as soybean meal, economic allocation, incl. crushing) | 3.0 | ~1.75 / ~0.35 |
| alfalfa | 0.4 / 0.35 | same (already farm gate) / 0.15 |
| grass-hay | 0.3 / 0.25 | same (already farm gate) / 0.14 |
| fishmeal | 6.0 / 6.5 | 0.32 / — |
| fish-oil | 3.5 / 4.0 | 4.43, 4.0 / — |

Existing notes that were wrong got a `CORRECTION 2026-09-24` line and lower confidence;
values were kept.

**Milk / yogurt / butter**: gas values, feed rations (World + US) and post-farm CO₂ replaced.
Each replaced value's note starts with `CORRECTION 2026-09-24: replaced <old> …`.

| Field (milk) | Old | New world | New US |
|---|---|---|---|
| CH₄ kg/kg | 0.24, 0.22 | ~0.049 | 0.021 |
| N₂O kg/kg (manure only) | 0.004 | 0.00125 | 0.00026 |
| CO₂ kg/kg (on-farm + post-farm) | 0.075 | 0.94 | 0.54 |
| Feed (kg CO₂e/kg) | 2.26 | 0.74 | 0.13 |

Allocation: milk carries its published share of dairy-herd emissions (GLEAM ~0.92 world,
Pelton 81% US); the rest belongs to meat from culled cows and calves. Feed ratios are derived
from the milk-allocated enteric CH₄, so they follow the same split. The redundant yogurt CH₄
entry was removed.

### Result (kg CO₂e per kg, as the app computes it)

| Food | Before (world) | After world | After US | Published |
|---|---|---|---|---|
| Milk | 9.84 | 3.39 | 1.32 | 3.15 world (P&N); ~1.8 US (Pelton 2025, Thoma 2013) |
| Yogurt | 11.31 | 4.08 | 1.70 | ~3.6 world; 2.38 US (Pelton 2026) |
| Butter | 80.68 | 22.1 | 8.7 | 9.0 (Flysjö 2011, DK) – 20.1 (P&N-derived); 14.3 US |

The feed change lowers **every farmed animal**, not just dairy. World (before → after):
beef 97.7 → 91.3, chicken 5.8 → 3.75, pork 19.9 → 16.4, turkey 13.1 → 10.2,
egg 5.3 → 3.35, lamb 39.2 → 33.5, salmon 12.1 → 7.5, shrimp-farmed 27.0 → 23.7,
tilapia-farmed 6.7 → 4.5.

### Still open

- **US milk is ~27% below published (1.32 vs ~1.8).** Almost all of it is feed: our US
  farm-gate crop factors give 0.13 kg CO₂e/kg milk, while Pelton 2025 puts US dairy feed at
  ~0.66. The US crop factors (corn ~0.27, alfalfa 0.15) look 3–4× lower than the feed factors
  Pelton uses. Needs a look at the US farm-gate factors rather than inflating the ration.
- **Butter's published figures disagree** (9.0 Danish measurement vs 20.1 P&N-derived world;
  14.3 US). The build check flags butter in both regions for this reason.
- **US egg is flagged (1.91 vs 4.58)** because egg has no US published total, so it is compared
  with the world figure. US egg LCAs (~2–2.5) suggest 1.91 is plausible; add a US total.
- **Beef's gas values were back-solved** to match P&N's 99 total. CO₂ is a leftover plug, CH₄
  (1.875 kg) looks ~30–50% high vs GLEAM, and CH₄ + N₂O exceed P&N's whole farm stage. Beef's
  total still looks right, but its breakdown is not.
- **Chicken, pork, turkey and others have no published `emissions_per_kg`**, so the build
  check can't verify them. Chicken world is now 3.75 vs P&N poultry 9.87.
- **Other P&N-based crop values are per retail product**, not per kg of crop (e.g. barley is per
  litre of beer). That affects plant foods themselves, not just feed.
- **Fishmeal's farm-gate value comes from one Peruvian producer** (low end of the global
  range).
- Some food files cite source id 99, which is missing from `sources.json`.
