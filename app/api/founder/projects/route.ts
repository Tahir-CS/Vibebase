import { NextRequest, NextResponse } from "next/server";
import { createFounderProject, listFounderProjects } from "@/lib/persistent/identity";
import { requireFounder } from "@/lib/persistent/session";
import { errorResponse } from "@/lib/vibebase/http";

export async function GET(request: NextRequest) {
  try {
    const founder = await requireFounder(request);
    return NextResponse.json({ data: await listFounderProjects(founder.founderId), message: "Projects loaded" });
  } catch (error) {
    return errorResponse(error, "act_founder_projects_list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const founder = await requireFounder(request);
    const body = await request.json();
    const result = await createFounderProject(founder.founderId, body.name);
    return NextResponse.json({ data: result, message: "Project created. The agent key is shown only now." }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "act_founder_projects_create");
  }
}
