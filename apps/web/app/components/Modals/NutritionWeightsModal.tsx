'use client';

import { Modal } from "./Modal";

export function NutritionWeightsModal({ onClose }: { onClose: () => void }) {
    return (
        <Modal title="Nutrition Score Weights" onClose={onClose}>
            <p>
                The Nutrition score adds up points for each 100 g of food, then scales them to per 100 calories so foods are compared calorie for calorie:
            </p>
            <p className="font-mono text-xs">
                points = protein × protein quality + fiber + vitamins & minerals − saturated fat − free sugar − sodium
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
                Protein quality adjusts the protein points for how well the protein matches what the body needs. For each of the nine essential amino acids, the food's amount per gram of protein is compared with the FAO/WHO adult requirement. The weakest one sets the food's amino acid score (capped at 100%): wheat is short on lysine and scores about 55%, while eggs, meat and dairy score 100%. The Protein Quality slider is how much of the protein points are lost at that shortfall: at 50%, a food scoring 55% keeps about 78% of its protein points. Foods with no amino acid data aren't penalised. Hover a food's nutrition figure to see its full amino acid profile.
            </p>
            <p>
                Foods with no calories (like diet soda) always score 0.
            </p>
        </Modal>
    );
}
