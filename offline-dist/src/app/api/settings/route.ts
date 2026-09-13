import { NextResponse } from "next/server";
import { db, isOffline } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { serverOfflineStore } from "@/lib/serverOfflineStore";

const DEFAULT_SETTINGS = {
  company_name: "Elite Communication",
  brand_name: "Samsung Service Center",
  address: "B-20/44, A-7, Bhelupur, (Besides Hotel Diamond), Varanasi - 221010",
  contact: "9569894030, 9026723192",
  email: "elitecom2020.vns@gmail.com",
  gst_no: "09AFMPS0091NIZR",
  admin_pin: "1234",
  tax_rate: "18",
  warranty_days: "30",
  whatsapp_message_template: "Dear {customer_name},\n\nThank you for visiting {company_name}!\n\nYour Invoice #{invoice_no} for Job #{job_no} has been generated.\n\nTotal Amount: ₹{total}\nPaid: ₹{paid}\nBalance: ₹{balance}\n\nWarranty: {warranty_days} days\nWarranty Expiry: {warranty_expiry}\n\nPlease find the attached invoice PDF.\n\nFor any queries, contact us at {contact}.\n\nThank you!",
};

export async function GET() {
  try {
    if (isOffline || !db) {
      const offlineSettings = serverOfflineStore.getSettings();
      return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...offlineSettings } });
    }

    const allSettings = await db.select().from(settings);
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    allSettings.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    const offlineSettings = serverOfflineStore.getSettings();
    return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...offlineSettings } });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value required" }, { status: 400 });
    }

    if (isOffline || !db) {
      serverOfflineStore.saveSetting(key, String(value));
      return NextResponse.json({ success: true });
    }

    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));

    if (existing) {
      await db
        .update(settings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value: String(value) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
