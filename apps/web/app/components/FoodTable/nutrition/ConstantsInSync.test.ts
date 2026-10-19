import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GWP_CH4, GWP_N2O, SQUARE_METERS_PER_HA } from '../FoodDetail/math/MathShared';
import { AMINO_ACID_REQUIREMENTS, MICRONUTRIENT_INFO } from './FoodTableCalculations';
import { MICRONUTRIENT_KEYS } from '../Types/FoodTableTypes';

// The web app shows copies of numbers that the Rust scorer actually uses. These tests read the Rust
// source so a change on one side without the other fails here instead of showing wrong working to users.
const RUST_SRC = new URL('../../../../../../services/wasm-calculations/src/', import.meta.url);
const rustSource = (path: string) => readFileSync(new URL(path, RUST_SRC), 'utf8');
const toNumber = (text: string) => Number(text.replaceAll('_', ''));

// Regex on purpose: it pulls the number out of a line like `const NAME: f64 = 28.0;`.
function rustConstant(source: string, name: string): number {
    const match = source.match(new RegExp(`const ${name}:\\s*f64 = ([\\d_.]+);`));
    if (!match) throw new Error(`Could not find ${name} in the Rust source`);
    return toNumber(match[1]);
}

// Regex on purpose: reads the `name: Some(9.0),` lines inside one `const NAME: Micronutrients = Micronutrients { ... };` block.
function rustNutrientTable(source: string, tableName: string): Record<string, number> {
    const block = source.match(new RegExp(`const ${tableName}: Micronutrients = Micronutrients \\{([^}]*)\\};`))?.[1];
    if (!block) throw new Error(`Could not find ${tableName} in the Rust source`);
    const entries = [...block.matchAll(/(\w+):\s*Some\(([\d.]+)\)/g)].map(([, key, value]) => [key, Number(value)] as const);
    return Object.fromEntries(entries);
}

describe('constants copied from Rust', () => {
    it('global warming potentials match emissions.rs', () => {
        const emissions = rustSource('calculations/emissions.rs');
        expect(GWP_CH4).toBe(rustConstant(emissions, 'GWP_CH4'));
        expect(GWP_N2O).toBe(rustConstant(emissions, 'GWP_N2O'));
    });

    it('square meters per hectare matches eco/constants.rs', () => {
        expect(SQUARE_METERS_PER_HA).toBe(rustConstant(rustSource('calculations/eco/constants.rs'), 'SQUARE_METERS_PER_HA'));
    });

    it('daily values and double credit match micronutrients.rs', () => {
        const source = rustSource('models/input/micronutrients.rs');
        const dailyValues = rustNutrientTable(source, 'DAILY_VALUES');
        const doubleCredit = rustNutrientTable(source, 'DOUBLE_CREDIT');
        for (const key of MICRONUTRIENT_KEYS) {
            expect(MICRONUTRIENT_INFO[key].dailyValue, `${key} daily value`).toBe(dailyValues[key]);
            expect(MICRONUTRIENT_INFO[key].credit, `${key} credit`).toBe(doubleCredit[key] ?? 1);
        }
    });

    it('amino acid requirements match amino_acids.rs, in the same order', () => {
        const source = rustSource('models/input/amino_acids.rs');
        const rustNames = ['HISTIDINE', 'ISOLEUCINE', 'LEUCINE', 'LYSINE', 'METHIONINE_PLUS_CYSTINE', 'PHENYLALANINE_PLUS_TYROSINE', 'THREONINE', 'TRYPTOPHAN', 'VALINE'];
        expect(AMINO_ACID_REQUIREMENTS.map(row => row.mgPerGramProtein)).toEqual(rustNames.map(name => rustConstant(source, name)));
    });
});
