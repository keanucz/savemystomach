// Optional: run `lib/schema.cypher` once on a fresh database for constraints and indexes.
// Markets
CREATE (m1:Market {id: 'mkt_banbury', name: 'Banbury Market', town: 'Banbury', day_of_week: 'thursday', lat: 52.0629, lng: -1.3398})
CREATE (m2:Market {id: 'mkt_witney', name: 'Witney Market', town: 'Witney', day_of_week: 'friday', lat: 51.7842, lng: -1.4853})
CREATE (m3:Market {id: 'mkt_stratford', name: 'Stratford-upon-Avon Market', town: 'Stratford-upon-Avon', day_of_week: 'friday', lat: 52.1917, lng: -1.7073})
CREATE (m4:Market {id: 'mkt_chipping', name: 'Chipping Norton Market', town: 'Chipping Norton', day_of_week: 'wednesday', lat: 51.9415, lng: -1.5450})
CREATE (m5:Market {id: 'mkt_henley', name: 'Henley-on-Thames Market', town: 'Henley-on-Thames', day_of_week: 'thursday', lat: 51.5360, lng: -0.9018})
CREATE (m6:Market {id: 'mkt_oxford', name: 'Oxford Gloucester Green', town: 'Oxford', day_of_week: 'wednesday', lat: 51.7548, lng: -1.2624})
CREATE (m7:Market {id: 'mkt_abingdon', name: 'Abingdon Market', town: 'Abingdon', day_of_week: 'monday', lat: 51.6708, lng: -1.2828})
CREATE (m8:Market {id: 'mkt_borough', name: 'Borough Market', town: 'London', day_of_week: 'saturday', lat: 51.5054, lng: -0.0907})
CREATE (m9:Market {id: 'mkt_whitechapel', name: 'Whitechapel Market', town: 'London', day_of_week: 'thursday', lat: 51.5176, lng: -0.0612})
CREATE (m10:Market {id: 'mkt_stow', name: 'Stow-on-the-Wold Market', town: 'Stow-on-the-Wold', day_of_week: 'thursday', lat: 51.9326, lng: -1.7250})

// Food Desert LSOAs
CREATE (l1:LSOA {code: 'E01004297', name: 'Tower Hamlets 026A', borough: 'Tower Hamlets', imd_decile: 1, is_food_desert: true, lat: 51.5238, lng: -0.0588})
CREATE (l2:LSOA {code: 'E01004305', name: 'Tower Hamlets 027B', borough: 'Tower Hamlets', imd_decile: 2, is_food_desert: true, lat: 51.5215, lng: -0.0540})
CREATE (l3:LSOA {code: 'E01001755', name: 'Hackney 015A', borough: 'Hackney', imd_decile: 1, is_food_desert: true, lat: 51.5450, lng: -0.0530})
CREATE (l4:LSOA {code: 'E01001762', name: 'Hackney 016C', borough: 'Hackney', imd_decile: 2, is_food_desert: true, lat: 51.5485, lng: -0.0612})
CREATE (l5:LSOA {code: 'E01003583', name: 'Newham 022B', borough: 'Newham', imd_decile: 1, is_food_desert: true, lat: 51.5325, lng: 0.0188})
CREATE (l6:LSOA {code: 'E01028557', name: 'Cherwell 008A', borough: 'Cherwell (Banbury)', imd_decile: 3, is_food_desert: true, lat: 52.0540, lng: -1.3250})
CREATE (l7:LSOA {code: 'E01028562', name: 'Cherwell 008C', borough: 'Cherwell (Banbury)', imd_decile: 2, is_food_desert: true, lat: 52.0480, lng: -1.3520})
CREATE (l8:LSOA {code: 'E01008881', name: 'Birmingham 056A', borough: 'Birmingham', imd_decile: 1, is_food_desert: true, lat: 52.4862, lng: -1.8904})
CREATE (l9:LSOA {code: 'E01008905', name: 'Birmingham 058B', borough: 'Birmingham', imd_decile: 1, is_food_desert: true, lat: 52.4920, lng: -1.8825})
CREATE (l10:LSOA {code: 'E01017482', name: 'West Oxfordshire 005B', borough: 'West Oxfordshire', imd_decile: 4, is_food_desert: true, lat: 51.7700, lng: -1.5100})

// Traders
CREATE (t1:Trader {id: 'trader_001', name: 'James Whitaker', business: 'Cotswold Fruit & Veg', vehicle_capacity_kg: 800})
CREATE (t2:Trader {id: 'trader_002', name: 'Sarah Mills', business: 'Thames Valley Greens', vehicle_capacity_kg: 600})
CREATE (t3:Trader {id: 'trader_003', name: 'David Chen', business: 'London Borough Bakery', vehicle_capacity_kg: 400})

// Products
CREATE (p1:Product {sku: 'tomato', name: 'Tomatoes', category: 'vegetable', price_pence: 280, unit: 'kg'})
CREATE (p2:Product {sku: 'spinach', name: 'Spinach', category: 'vegetable', price_pence: 180, unit: '500g'})
CREATE (p3:Product {sku: 'apple', name: 'Apples', category: 'fruit', price_pence: 350, unit: '1kg bag'})
CREATE (p4:Product {sku: 'potato', name: 'Potatoes', category: 'vegetable', price_pence: 200, unit: 'kg'})
CREATE (p5:Product {sku: 'carrot', name: 'Carrots', category: 'vegetable', price_pence: 150, unit: 'kg'})
CREATE (p6:Product {sku: 'bread', name: 'Sourdough Loaf', category: 'bakery', price_pence: 350, unit: 'loaf'})
CREATE (p7:Product {sku: 'milk', name: 'Whole Milk', category: 'dairy', price_pence: 120, unit: 'litre'})
CREATE (p8:Product {sku: 'eggs', name: 'Free-range Eggs', category: 'dairy', price_pence: 300, unit: 'dozen'})

// Trader attendance
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_001'}), (m:Market {id: 'mkt_banbury'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_001'}), (m:Market {id: 'mkt_witney'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_001'}), (m:Market {id: 'mkt_stratford'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_002'}), (m:Market {id: 'mkt_henley'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_002'}), (m:Market {id: 'mkt_oxford'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_003'}), (m:Market {id: 'mkt_borough'}) CREATE (t)-[:ATTENDS]->(m)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_003'}), (m:Market {id: 'mkt_whitechapel'}) CREATE (t)-[:ATTENDS]->(m)

// Trader supplies
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_001'}), (p:Product) WHERE p.sku IN ['tomato','spinach','apple','potato','carrot'] CREATE (t)-[:SUPPLIES]->(p)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_002'}), (p:Product) WHERE p.sku IN ['tomato','spinach','apple','carrot'] CREATE (t)-[:SUPPLIES]->(p)
WITH 1 AS dummy
MATCH (t:Trader {id: 'trader_003'}), (p:Product) WHERE p.sku IN ['bread','milk','eggs'] CREATE (t)-[:SUPPLIES]->(p)

// Residents - 3 in demo LSOA E01004297
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01004297'})
CREATE (r1:Resident {id: 'res_001', postcode: 'E2 6BG', email: 'aisha@example.com'})-[:LIVES_IN]->(l)
CREATE (r2:Resident {id: 'res_002', postcode: 'E2 6BG', email: 'mohamed@example.com'})-[:LIVES_IN]->(l)
CREATE (r3:Resident {id: 'res_003', postcode: 'E2 6BG', email: 'priya@example.com'})-[:LIVES_IN]->(l)

// Residents - 1 per remaining LSOA
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01004305'}) CREATE (:Resident {id: 'res_004', postcode: 'E2 7NX', email: 'james@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01001755'}) CREATE (:Resident {id: 'res_005', postcode: 'E8 1HN', email: 'fatima@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01001762'}) CREATE (:Resident {id: 'res_006', postcode: 'E8 2PB', email: 'raj@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01003583'}) CREATE (:Resident {id: 'res_007', postcode: 'E13 8QE', email: 'chen@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01028557'}) CREATE (:Resident {id: 'res_008', postcode: 'OX16 5AB', email: 'sarah@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01028562'}) CREATE (:Resident {id: 'res_009', postcode: 'OX16 9DH', email: 'mike@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01008881'}) CREATE (:Resident {id: 'res_010', postcode: 'B19 1AA', email: 'grace@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01008905'}) CREATE (:Resident {id: 'res_011', postcode: 'B19 3QR', email: 'omar@example.com'})-[:LIVES_IN]->(l)
WITH 1 AS dummy
MATCH (l:LSOA {code: 'E01017482'}) CREATE (:Resident {id: 'res_012', postcode: 'OX28 6NL', email: 'emma@example.com'})-[:LIVES_IN]->(l)

// Orders - Tower Hamlets ~340 total
// res_001: tomato x4 (1120p), spinach x3 (540p), apple x2 (700p), potato x3 (600p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_001'}), (p:Product {sku: 'tomato'}) CREATE (r)-[:ORDERED {qty: 4, price_pence: 280, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_001'}), (p:Product {sku: 'spinach'}) CREATE (r)-[:ORDERED {qty: 3, price_pence: 180, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_001'}), (p:Product {sku: 'apple'}) CREATE (r)-[:ORDERED {qty: 2, price_pence: 350, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_001'}), (p:Product {sku: 'potato'}) CREATE (r)-[:ORDERED {qty: 3, price_pence: 200, status: 'pending', trader_id: 'trader_001'}]->(p)

// res_002: tomato x5 (1400p), spinach x4 (720p), carrot x5 (750p), potato x4 (800p), apple x3 (1050p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_002'}), (p:Product {sku: 'tomato'}) CREATE (r)-[:ORDERED {qty: 5, price_pence: 280, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_002'}), (p:Product {sku: 'spinach'}) CREATE (r)-[:ORDERED {qty: 4, price_pence: 180, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_002'}), (p:Product {sku: 'carrot'}) CREATE (r)-[:ORDERED {qty: 5, price_pence: 150, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_002'}), (p:Product {sku: 'potato'}) CREATE (r)-[:ORDERED {qty: 4, price_pence: 200, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_002'}), (p:Product {sku: 'apple'}) CREATE (r)-[:ORDERED {qty: 3, price_pence: 350, status: 'pending', trader_id: 'trader_001'}]->(p)

// res_003: tomato x6 (1680p), spinach x5 (900p), apple x4 (1400p), potato x5 (1000p), carrot x6 (900p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_003'}), (p:Product {sku: 'tomato'}) CREATE (r)-[:ORDERED {qty: 6, price_pence: 280, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_003'}), (p:Product {sku: 'spinach'}) CREATE (r)-[:ORDERED {qty: 5, price_pence: 180, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_003'}), (p:Product {sku: 'apple'}) CREATE (r)-[:ORDERED {qty: 4, price_pence: 350, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_003'}), (p:Product {sku: 'potato'}) CREATE (r)-[:ORDERED {qty: 5, price_pence: 200, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_003'}), (p:Product {sku: 'carrot'}) CREATE (r)-[:ORDERED {qty: 6, price_pence: 150, status: 'pending', trader_id: 'trader_001'}]->(p)

// Orders - Hackney ~180 (res_005 in E01001755)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_005'}), (p:Product {sku: 'tomato'}) CREATE (r)-[:ORDERED {qty: 8, price_pence: 280, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_005'}), (p:Product {sku: 'spinach'}) CREATE (r)-[:ORDERED {qty: 6, price_pence: 180, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_005'}), (p:Product {sku: 'carrot'}) CREATE (r)-[:ORDERED {qty: 8, price_pence: 150, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_005'}), (p:Product {sku: 'potato'}) CREATE (r)-[:ORDERED {qty: 6, price_pence: 200, status: 'pending', trader_id: 'trader_001'}]->(p)

// Orders - Banbury ~220 (res_008 in E01028557)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_008'}), (p:Product {sku: 'tomato'}) CREATE (r)-[:ORDERED {qty: 10, price_pence: 280, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_008'}), (p:Product {sku: 'apple'}) CREATE (r)-[:ORDERED {qty: 8, price_pence: 350, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_008'}), (p:Product {sku: 'potato'}) CREATE (r)-[:ORDERED {qty: 10, price_pence: 200, status: 'pending', trader_id: 'trader_001'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_008'}), (p:Product {sku: 'carrot'}) CREATE (r)-[:ORDERED {qty: 10, price_pence: 150, status: 'pending', trader_id: 'trader_001'}]->(p)

// Orders - Birmingham ~95 (res_010 in E01008881)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_010'}), (p:Product {sku: 'bread'}) CREATE (r)-[:ORDERED {qty: 8, price_pence: 350, status: 'pending', trader_id: 'trader_003'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_010'}), (p:Product {sku: 'milk'}) CREATE (r)-[:ORDERED {qty: 10, price_pence: 120, status: 'pending', trader_id: 'trader_003'}]->(p)
WITH 1 AS dummy
MATCH (r:Resident {id: 'res_010'}), (p:Product {sku: 'eggs'}) CREATE (r)-[:ORDERED {qty: 3, price_pence: 300, status: 'pending', trader_id: 'trader_003'}]->(p)
