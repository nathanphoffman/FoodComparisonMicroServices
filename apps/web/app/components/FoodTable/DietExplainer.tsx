// "How did we get these numbers": the plain-English method behind the Diet modal's % figures.
// Keep in step with FoodTableRda.ts, FoodTableTargets.ts and FoodTableAbsorption.ts.

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-3">
            <h4 className="text-xs font-semibold text-neutral-800 mb-1">{title}</h4>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

export function DietExplainer() {
    return (
        <section className="mt-5 pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800">How did we get these numbers?</h3>

            <Subsection title="The general process">
                <p>
                    Each food in your diet is given a share of your day. By calories, a food's share is its percentage; by mass, its grams times its calories per gram, as a share of the total. Your foods' nutrients are blended by those shares into one per-100-calorie profile.
                </p>
                <p>
                    The bracketed number is that profile scaled up to your <strong>Total calories / day</strong>, then compared with a daily reference amount. So 10% per 100 calories on a 2,000 calorie diet reads (200%). Without a calorie total there are no whole-diet numbers.
                </p>
                <p>
                    The reference amounts come from the <strong>Daily needs</strong> setting: the US, Europe (EFSA), Japan, China or WHO/FAO, or the plain average of all five. On the average, a standard that sets no value for a nutrient is left out of that nutrient's average.
                </p>
            </Subsection>

            <Subsection title="Vitamins, minerals & omega-3">
                <p>
                    US values are the NIH RDAs (adequate intakes for vitamin K, potassium and ALA) by age band and sex. The other standards use adult male and female values. Under 19, every setting falls back to the US table, since only the US was entered by age. With no sex set, the male and female values are averaged.
                </p>
                <p>
                    <strong>Weight</strong> scales these needs by (your weight ÷ a reference weight)^0.75, because needs grow more slowly than body size. The reference weights are 76 kg for men, 61 kg for women and 70 kg if sex isn't set. A person 50% heavier needs about 36% more.
                </p>
                <p>
                    Vitamin D is the same as every other nutrient here. The US and EFSA values assume little or no sun, so there is no sunlight adjustment.
                </p>
            </Subsection>

            <Subsection title="Protein">
                <p>
                    Protein is per kg of body weight, so it needs your weight. Each standard has a general adult value: US 0.8, EFSA 0.83, WHO 0.83, Japan about 0.9 and China about 1.0 g/kg. On the average setting that is about 0.87 g/kg.
                </p>
                <p>
                    Those are for ordinary everyday life. Only sports bodies give higher numbers for training (the ACSM, Dietitians of Canada and Academy of Nutrition and Dietetics position, ISSN, and Germany's DGE all land between 1.2 and 2.0 g/kg). The <strong>Activity level</strong> slider sets a floor from those: modest exercise 1.0, moderately-heavy 1.1, heavy 1.2, athlete 1.6 and extreme athlete 2.0 g/kg. Your need uses whichever is higher, the floor or the standard's own value.
                </p>
                <p>
                    Example: 225 lb is 102.06 kg. At heavy exercise that is 102.06 × 1.2 = 122.5 g a day. The 1.0 and 1.1 stops are our own in-betweens, not published values.
                </p>
            </Subsection>

            <Subsection title="Limits: sodium, saturated fat, trans fat, cholesterol, sugar">
                <p>
                    These are ceilings, so the % is how much of the limit you use, and lower is better. Sodium and cholesterol are milligrams. Saturated fat, trans fat and sugar are limits on a share of your calories (for example 10% of calories from saturated fat), turned into grams using your calorie total.
                </p>
                <p>
                    <strong>Sugar:</strong> the amount shown is total sugar, but the % is free sugar against the added-sugar limit. Free sugar is the sugar beyond 5 g per gram of fiber, the same rule the Nutrition Score uses, so fruit isn't counted like soda. Not every standard sets every limit: EFSA has no saturated fat or sugar limit, and Japan has no sugar limit.
                </p>
            </Subsection>

            <Subsection title="Total fat and carbs">
                <p>
                    These use the middle of each standard's recommended range of calories (for example 20–35% from fat), turned into grams. The goal is to land near the middle, so being well under or well over both score poorly.
                </p>
            </Subsection>

            <Subsection title="Fiber">
                <p>
                    Fiber is a minimum, in grams a day: US 38 for men and 25 for women, Japan 21 and 18, and about 25 for Europe, China and WHO.
                </p>
            </Subsection>

            <Subsection title="B12, calcium and vitamin C: how spread out you eat">
                <p>
                    Your body can only absorb so much B12 (about 1.5 µg), calcium (about 500 mg) and vitamin C (about 200 mg) in a single meal. The <strong>Longest gap</strong> slider sets how concentrated your meals are: 0.1 days is 10 meals a day, 10 days is one meal every 10 days. The longer the gap, the more of each food's daily amount arrives in one sitting beyond that limit, so less of it counts toward the green number. Three meals a day is the baseline and counts in full, and more meals never count for more than that. Iron and zinc aren't adjusted, because their absorption depends more on what you eat with them.
                </p>
            </Subsection>

            <Subsection title="The colors">
                <p>
                    Blue is very good, green is good, yellow is neutral, orange is a little off and red is far off. For something to reach (vitamins, fiber, protein), under 50% is red, 50–75% orange, 75–125% yellow, 125–250% green and over 250% blue, which is a lot, not necessarily bad. For a limit, up to 50% is blue, up to 100% green, up to 125% yellow, up to 150% orange and over that red. For fat and carbs, 90–110% is blue and 75–125% is green, with the colors worsening further out.
                </p>
            </Subsection>

            <Subsection title="What to keep in mind">
                <p>
                    Many of the Japan, China, WHO and some EFSA reference values were entered from memory and are approximate, so treat the averages as a guide and check the official tables for anything that matters. These are targets for healthy adults, not medical advice. The Nutrition Score itself still uses fixed FDA daily values for every food, and doesn't use your age, sex, weight or any of these settings.
                </p>
            </Subsection>
        </section>
    );
}
