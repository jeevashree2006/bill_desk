// Units are stored in the singular ("Bag"); labels pluralise where it reads better.
export const UNIT_SUGGESTIONS = ['Piece', 'Bag', 'Unit', 'Load', 'Ton', 'Cu.ft', 'Sq.ft', 'Kg', 'Litre'];

export const plural = (unit) => {
    if (!unit) return 'Units';
    return /s$/i.test(unit) ? unit : `${unit}s`;
};
