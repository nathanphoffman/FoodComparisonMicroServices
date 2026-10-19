import { AMINO_ACID_KEYS, type AminoAcidKey, type NutritionDetail } from '../../types/FoodTableTypes';

// What the body needs per gram of protein: the FAO (2013) indispensable amino acid reference pattern
// for older children, adolescents and adults, in mg per g of protein. Display copy of the constants in
// services/wasm-calculations amino_acids.rs — keep in sync. `group` ties methionine + cystine and
// phenylalanine + tyrosine together, as FAO scores them.
export type AminoAcidInfo = { label: string; essential: boolean; group?: 'saa' | 'aaa' };
export const AMINO_ACID_INFO: Record<AminoAcidKey, AminoAcidInfo> = {
    histidine:     { label: 'Histidine',     essential: true },
    isoleucine:    { label: 'Isoleucine',    essential: true },
    leucine:       { label: 'Leucine',       essential: true },
    lysine:        { label: 'Lysine',        essential: true },
    methionine:    { label: 'Methionine',    essential: true, group: 'saa' },
    cystine:       { label: 'Cystine',       essential: true, group: 'saa' },
    phenylalanine: { label: 'Phenylalanine', essential: true, group: 'aaa' },
    tyrosine:      { label: 'Tyrosine',      essential: true, group: 'aaa' },
    threonine:     { label: 'Threonine',     essential: true },
    tryptophan:    { label: 'Tryptophan',    essential: true },
    valine:        { label: 'Valine',        essential: true },
    alanine:       { label: 'Alanine',       essential: false },
    arginine:      { label: 'Arginine',      essential: false },
    aspartic_acid: { label: 'Aspartic acid', essential: false },
    glutamic_acid: { label: 'Glutamic acid', essential: false },
    glycine:       { label: 'Glycine',       essential: false },
    proline:       { label: 'Proline',       essential: false },
    serine:        { label: 'Serine',        essential: false },
};

// The nine scored requirements, mg per g of protein. `keys` are summed before comparing.
export const AMINO_ACID_REQUIREMENTS: { label: string; keys: AminoAcidKey[]; mgPerGramProtein: number }[] = [
    { label: 'Histidine',                      keys: ['histidine'],                   mgPerGramProtein: 16 },
    { label: 'Isoleucine',                     keys: ['isoleucine'],                  mgPerGramProtein: 30 },
    { label: 'Leucine',                        keys: ['leucine'],                     mgPerGramProtein: 61 },
    { label: 'Lysine',                         keys: ['lysine'],                      mgPerGramProtein: 48 },
    { label: 'Methionine + cystine',           keys: ['methionine', 'cystine'],       mgPerGramProtein: 23 },
    { label: 'Phenylalanine + tyrosine',       keys: ['phenylalanine', 'tyrosine'],   mgPerGramProtein: 41 },
    { label: 'Threonine',                      keys: ['threonine'],                   mgPerGramProtein: 25 },
    { label: 'Tryptophan',                     keys: ['tryptophan'],                  mgPerGramProtein: 6.6 },
    { label: 'Valine',                         keys: ['valine'],                      mgPerGramProtein: 40 },
];

export type AminoAcidProfile = {
    /** The nine scored requirements: mg per g of this food's protein vs what the body needs. */
    requirements: { label: string; mgPerGramProtein: number; needed: number; share: number }[];
    /** The other amino acids (not scored): mg per g of protein. */
    others: { label: string; mgPerGramProtein: number }[];
    /** Amino acid score: the weakest requirement's share, capped at 1; null if any essential amino acid is unreported. */
    score: number | null;
    /** Label of the weakest requirement (the "limiting" amino acid); null when there is no score. */
    limiting: string | null;
};

/** Per-protein amino acid profile for a food or diet's nutrition detail; null when it has no amino acid data. */
export function aminoAcidProfile(detail: Pick<NutritionDetail, 'protein' | 'aminoAcids'>): AminoAcidProfile | null {
    const { protein, aminoAcids } = detail;
    if (!aminoAcids || protein <= 0) return null;
    const perProtein = (key: AminoAcidKey): number | null => aminoAcids[key] == null ? null : aminoAcids[key]! * 1000 / protein;
    const requirements = AMINO_ACID_REQUIREMENTS.flatMap(({ label, keys, mgPerGramProtein: needed }) => {
        const parts = keys.map(perProtein);
        if (parts.some(part => part == null)) return [];
        const mgPerGramProtein = parts.reduce<number>((sum, part) => sum + part!, 0);
        return [{ label, mgPerGramProtein, needed, share: mgPerGramProtein / needed }];
    });
    const others = AMINO_ACID_KEYS.filter(key => !AMINO_ACID_INFO[key].essential && aminoAcids[key] != null)
        .map(key => ({ label: AMINO_ACID_INFO[key].label, mgPerGramProtein: perProtein(key)! }));
    const complete = requirements.length === AMINO_ACID_REQUIREMENTS.length;
    const weakest = complete ? requirements.reduce((low, row) => (row.share < low.share ? row : low)) : null;
    if (requirements.length === 0 && others.length === 0) return null;
    return { requirements, others, score: weakest ? Math.min(1, weakest.share) : null, limiting: weakest ? weakest.label : null };
}
