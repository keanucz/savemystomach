/** Normalise UK postcode for display (uppercase, single space). */
export function normalizeUkPostcode(pc: string): string {
  return pc.trim().toUpperCase().replace(/\s+/g, ' ');
}

/** Compact form for graph matching (ignores space differences vs stored postcodes). */
export function compactUkPostcode(pc: string): string {
  return normalizeUkPostcode(pc).replace(/\s+/g, '');
}
