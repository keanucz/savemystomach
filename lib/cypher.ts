export const INFILL_STOPS_QUERY = `
MATCH (t:Trader {id: $traderId})-[:ATTENDS]->(m1:Market)
MATCH (t)-[:ATTENDS]->(m2:Market)
WHERE m1.day_of_week = m2.day_of_week AND m1.id < m2.id
MATCH (l:LSOA {is_food_desert: true})
WHERE point.distance(
        point({latitude: m1.lat, longitude: m1.lng}),
        point({latitude: l.lat, longitude: l.lng})
      ) +
      point.distance(
        point({latitude: l.lat, longitude: l.lng}),
        point({latitude: m2.lat, longitude: m2.lng})
      ) <
      point.distance(
        point({latitude: m1.lat, longitude: m1.lng}),
        point({latitude: m2.lat, longitude: m2.lng})
      ) * 1.5
MATCH (r:Resident)-[:LIVES_IN]->(l)
MATCH (r)-[o:ORDERED {status: 'pending'}]->(p:Product)
WHERE o.trader_id = t.id
MATCH (t)-[:SUPPLIES]->(p)
WITH l, m1, m2, sum(o.qty * o.price_pence) AS demand_pence, count(DISTINCT r) AS residents
WHERE demand_pence > 5000
RETURN l.name AS lsoa_name, l.code AS lsoa_code, l.borough AS borough,
       l.lat AS lat, l.lng AS lng,
       demand_pence / 100 AS demand_gbp,
       residents,
       m1.name AS market_a, m2.name AS market_b,
       m1.day_of_week AS day
ORDER BY demand_pence DESC
LIMIT 5
`;

export const TRADER_PROFILE_QUERY = `
MATCH (t:Trader {id: $traderId})
OPTIONAL MATCH (t)-[:ATTENDS]->(m:Market)
WITH t, collect(DISTINCT {market: m.name, day: m.day_of_week, town: m.town}) AS circuit
OPTIONAL MATCH (t)-[:SUPPLIES]->(p:Product)
RETURN t.name AS name, t.business AS business,
       circuit,
       collect(DISTINCT {sku: p.sku, name: p.name, price_pence: p.price_pence, unit: p.unit}) AS products
`;

export const RESIDENT_LOOKUP_QUERY = `
MATCH (r:Resident)-[:LIVES_IN]->(l:LSOA)
WHERE replace(toUpper(trim(r.postcode)), ' ', '') = $postcodeCompact
OPTIONAL MATCH (t:Trader)-[s:CONFIRMED_STOP]->(l)
WHERE s.date >= date() OR s.date IS NULL
OPTIONAL MATCH (t)-[:SUPPLIES]->(p:Product)
WITH l, t, s, collect(DISTINCT {sku: p.sku, name: p.name, price_pence: p.price_pence, unit: p.unit}) AS products
RETURN l.code AS lsoa_code, l.name AS lsoa_name, l.borough AS borough,
       l.lat AS lat, l.lng AS lng,
       collect(DISTINCT {
         trader_id: t.id,
         trader_name: t.business,
         scheduled_time: s.scheduled_time,
         lat: l.lat, lng: l.lng,
         available_products: products
       }) AS upcoming_stops
LIMIT 1
`;

export const ACCEPT_STOP_MUTATION = `
MATCH (t:Trader {id: $traderId}), (l:LSOA {code: $lsoaCode})
CREATE (t)-[:CONFIRMED_STOP {date: date($date), scheduled_time: $scheduledTime, expected_value_pence: $expectedValuePence}]->(l)
RETURN t.id AS trader_id, l.code AS lsoa_code
`;

/** Marks pending orders for this trader in this LSOA as confirmed after the stop is saved. */
export const CONFIRM_STOP_ORDERS_MUTATION = `
MATCH (t:Trader {id: $traderId}), (l:LSOA {code: $lsoaCode})
MATCH (r:Resident)-[:LIVES_IN]->(l)
MATCH (r)-[o:ORDERED {status: 'pending'}]->(p:Product)
WHERE o.trader_id = t.id AND (t)-[:SUPPLIES]->(p)
SET o.status = 'confirmed', o.fulfilled_at = datetime()
RETURN count(o) AS orders_confirmed
`;

export const PLACE_ORDER_MUTATION = `
MATCH (t:Trader {id: $traderId})
MATCH (r:Resident)-[:LIVES_IN]->(l:LSOA {code: $lsoaCode})
WHERE replace(toUpper(trim(r.postcode)), ' ', '') = $postcodeCompact
WITH t, r, $items AS items
UNWIND items AS item
MATCH (p:Product {sku: item.sku})
WHERE (t)-[:SUPPLIES]->(p)
WITH t, r, collect({p: p, qty: item.qty}) AS rows, size($items) AS expected
WHERE size(rows) = expected
UNWIND rows AS row
CREATE (r)-[:ORDERED {
  qty: row.qty,
  price_pence: row.p.price_pence,
  status: 'pending',
  placed_at: datetime(),
  trader_id: t.id
}]->(row.p)
RETURN count(*) AS items_ordered
`;
