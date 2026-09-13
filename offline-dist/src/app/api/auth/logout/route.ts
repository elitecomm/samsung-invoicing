import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("auth_role", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("auth_user", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET() {
  return POST();
}
