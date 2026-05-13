import neo4j, {
  Driver,
  Integer,
  isDate,
  isDateTime,
  isDuration,
  isInt,
  isLocalDateTime,
  isLocalTime,
  isNode,
  isPath,
  isPoint,
  isRelationship,
  isTime,
  integer,
} from 'neo4j-driver';

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

function intishToNumberOrString(v: Integer | number): number | string {
  if (typeof v === 'number') return v;
  return integer.inSafeRange(v) ? integer.toNumber(v) : integer.toString(v);
}

/**
 * Converts Neo4j driver values (Integer, temporal, Point, graph types) into JSON-safe data.
 */
export function serializeNeo4jValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string' || t === 'boolean' || t === 'number') return value;
  if (t === 'bigint') return Number(value);

  if (isInt(value)) {
    return intishToNumberOrString(value);
  }

  if (
    isDate(value) ||
    isDateTime(value) ||
    isLocalDateTime(value) ||
    isTime(value) ||
    isLocalTime(value) ||
    isDuration(value)
  ) {
    return value.toString();
  }

  if (isPoint(value)) {
    const sridRaw = value.srid;
    const srid = isInt(sridRaw)
      ? intishToNumberOrString(sridRaw)
      : (sridRaw as number);
    if (srid === 4326) {
      const o: Record<string, number> = { longitude: value.x, latitude: value.y };
      if (value.z !== undefined) o.height = value.z;
      return o;
    }
    const o: Record<string, unknown> = { srid, x: value.x, y: value.y };
    if (value.z !== undefined) o.z = value.z;
    return o;
  }

  if (isNode(value)) {
    return {
      labels: value.labels,
      properties: serializePlainProperties(value.properties as Record<string, unknown>),
    };
  }

  if (isRelationship(value)) {
    return {
      type: value.type,
      properties: serializePlainProperties(value.properties as Record<string, unknown>),
    };
  }

  if (isPath(value)) {
    return {
      length: value.length,
      start: serializeNeo4jValue(value.start),
      end: serializeNeo4jValue(value.end),
      segments: value.segments.map((seg) => ({
        start: serializeNeo4jValue(seg.start),
        relationship: serializeNeo4jValue(seg.relationship),
        end: serializeNeo4jValue(seg.end),
      })),
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeNeo4jValue);
  }

  if (t === 'object' && value !== null && value.constructor === Object) {
    return serializePlainProperties(value as Record<string, unknown>);
  }

  try {
    JSON.stringify(value);
    return value;
  } catch {
    return String(value);
  }
}

function serializePlainProperties(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    out[key] = serializeNeo4jValue(obj[key]);
  }
  return out;
}

function recordToObject<T = Record<string, unknown>>(r: {
  keys: PropertyKey[];
  get: (key: string) => unknown;
}): T {
  const obj: Record<string, unknown> = {};
  for (const key of r.keys) {
    obj[String(key)] = serializeNeo4jValue(r.get(String(key)));
  }
  return obj as T;
}

export async function query<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => recordToObject<T>(r));
  } finally {
    await session.close();
  }
}
