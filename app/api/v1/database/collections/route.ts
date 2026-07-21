import { NextRequest, NextResponse } from "next/server";
import { getVibebaseService } from "@/lib/vibebase/bootstrap";
import { errorResponse } from "@/lib/vibebase/http";
import { assertRequestRateLimit } from "@/lib/vibebase/rate-limit";
import { hasPersistentDatabase } from "@/lib/persistent/db";
import { createPersistentCollection, listPersistentCollections } from "@/lib/persistent/agent";

export async function GET(request: NextRequest) {
  const service = getVibebaseService();
  try {
    assertRequestRateLimit(request.headers.get("authorization"), request.headers.get("x-forwarded-for"));
    const collections = hasPersistentDatabase() ? await listPersistentCollections(request.headers.get("authorization")) : await service.listCollections(request.headers.get("authorization"));
    return NextResponse.json({
      data: collections,
      actionId: "act_collections_list",
      message: "Collections loaded"
    });
  } catch (error) {
    return errorResponse(error, "act_collections_list");
  }
}

export async function POST(request: NextRequest) {
  const service = getVibebaseService();
  const body = await request.json().catch(() => ({}));
  try {
    assertRequestRateLimit(request.headers.get("authorization"), request.headers.get("x-forwarded-for"));
    const result = hasPersistentDatabase() ? await createPersistentCollection(request.headers.get("authorization"), body, body.confirm === true) : await service.createCollection(request.headers.get("authorization"), body, body.confirm === true);
    return NextResponse.json({
      data: result.collection,
      actionId: result.actionId,
      message: "Collection created"
    });
  } catch (error) {
    return errorResponse(error, "act_collections_create");
  }
}
