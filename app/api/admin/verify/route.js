"use server";

import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const decoded = verifyToken(req);

  if (!decoded) {
    return NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 401 });
  }

  return NextResponse.json({ valid: true, user: decoded }, { status: 200 });
}
