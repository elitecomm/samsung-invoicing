import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc, sql, or, like } from "drizzle-orm";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gstNo: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    
    let query = db.select().from(customers);
    
    if (search) {
      query = query.where(
        or(
          like(customers.name, `%${search}%`),
          like(customers.mobile, `%${search}%`)
        )
      ) as any;
    }

    const allCustomers = await query.orderBy(desc(customers.createdAt)).limit(200);
    return NextResponse.json({ customers: allCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = customerSchema.parse(body);

    // Check if customer exists with same mobile
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.mobile, validated.mobile));

    if (existing) {
      // Update existing customer
      const [updated] = await db
        .update(customers)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(customers.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [newCustomer] = await db
      .insert(customers)
      .values(validated)
      .returning();

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
