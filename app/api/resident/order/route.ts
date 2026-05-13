export async function POST(req: Request) {
  const body = await req.json();

  // Stub response — will be replaced by real order creation
  void body;

  return Response.json({
    order_id: "ord_" + Date.now(),
    status: "confirmed",
  });
}
