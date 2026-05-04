import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    console.log("Property Finder Webhook received:", JSON.stringify(rawData, null, 2));

    // Property Finder standard lead payload structure (example, adjusted to their docs)
    // Note: Adjust mapping based on actual Property Finder webhook payload
    const leadData = {
      name: rawData.name || rawData.customer_name || "PF Lead",
      phone: rawData.phone || rawData.customer_phone || "No Phone",
      email: rawData.email || rawData.customer_email || "",
      comment: rawData.message || rawData.customer_message || "",
      property_ref: rawData.property_reference || rawData.reference || "",
      portal: 'propertyfinder',
      portal_lead_id: rawData.id?.toString() || rawData.lead_id?.toString(),
      source: 'Property Finder',
      status: 'Новая',
      raw_data: rawData
    };

    if (!leadData.portal_lead_id) {
      return NextResponse.json({ error: "Missing lead ID" }, { status: 400 });
    }

    // Upsert into leads table to handle potential updates or duplicates
    const { data, error } = await supabase
      .from("leads")
      .upsert([leadData], { 
        onConflict: 'portal_lead_id' 
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add history record
    await supabase.from("history").insert([
      {
        lead_id: data.id,
        action_type: "Входящий лид (Property Finder)",
        new_value: "Новая",
      },
    ]);

    // Send Telegram Notification (if configured)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `🏢 *Новый лид с Property Finder*\n\n` +
        `*Имя:* ${leadData.name}\n` +
        `*Телефон:* ${leadData.phone}\n` +
        `${leadData.email ? `*Email:* ${leadData.email}\n` : ""}` +
        `${leadData.property_ref ? `*Объект:* ${leadData.property_ref}\n` : ""}` +
        `${leadData.comment ? `\n*Сообщение:* ${leadData.comment}` : ""}`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    }

    return NextResponse.json({ success: true, lead_id: data.id });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
