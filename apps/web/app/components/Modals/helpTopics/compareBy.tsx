import type { HelpTopic } from './helpTopic';

// Help text for the Compare By sliders.
export const COMPARE_BY_TOPICS = {
    calorieWeight: {
        title: "Calorie Weight",
        body: (
            <>
                <p>
                    This controls how much caloric density contributes to the food comparison score. Calories are measured per 100g of food.
                </p>
                <p>
                    A higher calorie weight means foods that deliver more energy per unit are scored more favorably relative to their environmental or ethical cost. This is useful when comparing foods primarily as energy sources.
                </p>
                <p>
                    Calorie, protein, and dry mass sliders move independently — the percentage shown is each one's share of the total, so only how they compare to each other matters.
                </p>
            </>
        ),
    },
    proteinWeight: {
        title: "Protein Weight",
        body: (
            <>
                <p>
                    This controls how much protein density contributes to the food comparison score. Protein is measured in grams per 100g of food.
                </p>
                <p>
                    A higher protein weight scores foods more favorably when they deliver more protein relative to their environmental or ethical cost — useful when comparing foods as protein sources.
                </p>
                <p>
                    Calorie, protein, and dry mass sliders move independently — the percentage shown is each one's share of the total, so only how they compare to each other matters.
                </p>
            </>
        ),
    },
    dryMassWeight: {
        title: "Dry Mass Weight",
        body: (
            <>
                <p>
                    This controls how much dry mass — the weight of a food with all its water removed — contributes to the food comparison score. It is estimated as protein + fat + carbohydrate (including fiber).
                </p>
                <p>
                    Unlike raw weight, dry mass isn&apos;t inflated by water, so watery foods like milk or cucumber don&apos;t look like more food than they are, and it is the same whether a food is weighed raw or cooked. Compared with calories, it counts carbohydrate and fiber more fairly against fat.
                </p>
                <p>
                    Calorie, protein, and dry mass sliders move independently — the percentage shown is each one&apos;s share of the total, so only how they compare to each other matters.
                </p>
            </>
        ),
    },
    wetMassWeight: {
        title: "Wet Mass Weight",
        body: (
            <>
                <p>
                    This controls how much the weight of a food as you eat it — water included — contributes to the food comparison score. Beans, lentils, chickpeas, rice and quinoa are counted cooked, so the water they absorb while cooking counts toward their weight.
                </p>
                <p>
                    Unlike dry mass, wet mass rewards watery foods: a kg of cucumber or milk counts the same as a kg of almonds. Use it to compare foods by how much food ends up on the plate rather than by nutrients.
                </p>
                <p>
                    Calorie, protein, dry mass, and wet mass sliders move independently — the percentage shown is each one&apos;s share of the total, so only how they compare to each other matters.
                </p>
            </>
        ),
    },
} satisfies Record<string, HelpTopic>;
