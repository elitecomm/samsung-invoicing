import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the user_role cookie by setting maxAge to 0
  response.cookies.set({
    name: "user_role",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0, 
  });

  return response;
}