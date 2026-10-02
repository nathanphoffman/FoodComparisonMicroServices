'use client';

import { Modal } from "./Modal";

export function NutritionWeightsModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Nutrition Score Weights" onClose={onClose}>
            <p>
                The Nutrition score adds up points for each 100 g of food, then scales them to per 100 calories so foods are compared calorie for calorie:
            </p>
            <p className="font-mono text-xs">
                points = protein + fiber + vitamins & minerals − saturated fat − free sugar − sodium
            </p>
            <p>
                Each slider sets how many points one unit of that nutrient is worth. Protein, fiber and vitamins & minerals help the score; saturated fat, free sugar and sodium harm it. Setting a slider to 0 leaves that nutrient out.
            </p>
            <p>
                Vitamins & minerals count each nutrient's share of its daily value, so 100% of the daily value of iron is worth the slider's points. Nutrients most people fall short on (like calcium and potassium) count double.
            </p>
            <p>
                Free sugar is sugar beyond the fiber allowance: with an allowance of 5, a food with 2 g of fiber has its first 10 g of sugar ignored. This keeps whole fruit from being treated like table sugar.
            </p>
            <p>
                Foods with no calories (like diet soda) always score 0.
            </p>
        </Modal>
    );
}
