import neo4j, { Driver, Integer } from 'neo4j-driver';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
    );
  }
  return driver;
}

function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Integer.isInteger(value)) return (value as Integer).toNumber();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('low' in obj && 'high' in obj && Object.keys(obj).length === 2) {
      return Integer.toNumber(value as Integer);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = toPlain(v);
    }
    return result;
  }
  return value;
}

export async function query<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const key of r.keys) {
        obj[key as string] = toPlain(r.get(key));
      }
      return obj as T;
    });
  } finally {
    await session.close();
  }
}
