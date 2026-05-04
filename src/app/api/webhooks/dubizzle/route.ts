import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    console.log("Dubizzle Webhook received:", JSON.stringify(rawData, null, 2));

    const leadData = {
      name: rawData.name || rawData.customer_name || "Dubizzle Lead",
      phone: rawData.phone || rawData.customer_phone || "No Phone",
      email: rawData.email || rawData.customer_email || "",
      comment: rawData.message || "",
      property_ref: rawData.property_ref || "",
      portal: 'dubizzle',
      portal_lead_id: rawData.id?.toString() || rawData.lead_id?.toString(),
      source: 'Dubizzle',
      status: 'Новая',
      raw_data: rawData
    };

    if (!leadData.portal_lead_id) {
      return NextResponse.json({ error: "Missing lead ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("leads")
      .upsert([leadData], { onConflict: 'portal_lead_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("history").insert([{
      lead_id: data.id,
      action_type: "Входящий лид (Dubizzle)",
      new_value: "Новая",
    }]);

    return NextResponse.json({ success: true, lead_id: data.id });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
