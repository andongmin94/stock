import { NextResponse } from "next/server";

import { getMarkets } from "@/lib/markets/markets-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMarkets();

    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Market API request failed", error);

    return NextResponse.json(
      {
        error: "Market data request failed",
      },
      { status: 502 },
    );
  }
}
