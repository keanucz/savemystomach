export async function POST(req: Request) {
  const { postcode } = await req.json();

  // Stub response — will be replaced by real lookup against Neo4j
  void postcode;

  return Response.json({
    lsoa_code: "E01004297",
    lsoa_name: "Tower Hamlets 026A",
    borough: "Tower Hamlets",
    lat: 51.5238,
    lng: -0.0588,
    upcoming_stops: [
      {
        trader_id: "trader_001",
        trader_name: "Cotswold Fruit & Veg",
        scheduled_time: "2026-05-14T17:00:00",
        lat: 51.524,
        lng: -0.0585,
        available_products: [
          { sku: "tomato", name: "Tomatoes", price_pence: 280, unit: "kg" },
          { sku: "spinach", name: "Spinach", price_pence: 180, unit: "500g" },
          {
            sku: "apple",
            name: "Apples",
            price_pence: 350,
            unit: "1kg bag",
          },
          { sku: "potato", name: "Potatoes", price_pence: 200, unit: "kg" },
          { sku: "carrot", name: "Carrots", price_pence: 150, unit: "kg" },
        ],
      },
    ],
  });
}
