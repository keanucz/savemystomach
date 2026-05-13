/**
 * Demo JSON fallbacks for Neo4j/Kimchi outages.
 * In production, fallbacks are off unless ALLOW_DEMO_FALLBACK=true.
 * In non-production, fallbacks default on unless ALLOW_DEMO_FALLBACK=false.
 */
export function isDemoFallbackAllowed(): boolean {
  const flag = process.env.ALLOW_DEMO_FALLBACK;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
