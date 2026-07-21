import { NextResponse } from "next/server";

export async function GET() {
  // Agent keys are revealed only through the intentional local founder flow.
  return NextResponse.json({ error: { code: "RESOURCE_NOT_FOUND", message: "Not found." } }, { status: 404 });
}
