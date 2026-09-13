import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginIdentifier = body.username || body.email;
    const password = body.password;

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: "Credentials missing" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, loginIdentifier),
          eq(users.username, loginIdentifier)
        )
      )
      .limit(1);

    if (!user || password !== user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, role: user.role } 
    });

    response.cookies.set({
      name: "user_role",
      value: user.role,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login route failure:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
