import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol") || "WOLF";

  const res = await fetch(`https://iw.isoft-digital.net/api/tradex`);

  const data = await res.json();

  return NextResponse.json(data);
}
