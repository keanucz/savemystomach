import { query } from '@/lib/neo4j';
import { TRADER_PROFILE_QUERY } from '@/lib/cypher';

export async function getTraderProfile(traderId: string) {
  const rows = await query(TRADER_PROFILE_QUERY, { traderId });
  return rows[0] ?? null;
}
