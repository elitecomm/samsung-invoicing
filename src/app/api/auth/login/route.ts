import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Find the user in your database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || password !== user.password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Set the secure role cookie upon successful login
    const response = NextResponse.json({ success: true, role: user.role });
    
    response.cookies.set({
      name: "user_role",
      value: user.role, // "admin" or "staff"
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}