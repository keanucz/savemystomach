// Constraints and indexes for SaveMyStomach (Neo4j 5+).
// Run once per database, before or after `seed-data.cypher`.

CREATE CONSTRAINT trader_id_unique IF NOT EXISTS
FOR (t:Trader) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT market_id_unique IF NOT EXISTS
FOR (m:Market) REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT lsoa_code_unique IF NOT EXISTS
FOR (l:LSOA) REQUIRE l.code IS UNIQUE;

CREATE CONSTRAINT product_sku_unique IF NOT EXISTS
FOR (p:Product) REQUIRE p.sku IS UNIQUE;

CREATE CONSTRAINT resident_id_unique IF NOT EXISTS
FOR (r:Resident) REQUIRE r.id IS UNIQUE;

CREATE INDEX lsoa_food_desert IF NOT EXISTS
FOR (l:LSOA) ON (l.is_food_desert);

CREATE INDEX market_day IF NOT EXISTS
FOR (m:Market) ON (m.day_of_week);

CREATE INDEX resident_postcode IF NOT EXISTS
FOR (r:Resident) ON (r.postcode);
