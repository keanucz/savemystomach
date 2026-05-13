// Paste into Neo4j Browser (or cypher-shell) and run with EXPLAIN / PROFILE
// to inspect the infill hot path. Same graph pattern as INFILL_STOPS_QUERY in lib/cypher.ts.

PROFILE
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

// Example parameters for Browser:
// :params { traderId: 'trader_001' }
