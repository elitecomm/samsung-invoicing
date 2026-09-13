import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString()) as AuthUser;
      if (decoded.username && decoded.role) {
        return NextResponse.json({ user: decoded });
      }
    } catch {
      // Invalid token
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
