import { NextRequest } from "next/server";

const FACILITATOR_URL = process.env.NEXT_PUBLIC_FACILITATOR_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return Response.json({ error: "Address required" }, { status: 400 });
  }

  try {
    // Fetch payments from facilitator database
    const response = await fetch(`${FACILITATOR_URL}/payments/${address}`);
    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
