import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, messenger, budget, goal, comment, creative, offer } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // 1. Save to Supabase
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          phone,
          email,
          messenger,
          budget,
          goal,
          comment,
          creative,
          offer,
          status: "Новая",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Add history note
    await supabase.from("history").insert([
      {
        lead_id: lead.id,
        action_type: "Создана заявка",
        new_value: "Новая",
      },
    ]);

    // 3. Send Telegram Notification
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `🔔 *Новая заявка*\n\n` +
        `*Имя:* ${name}\n` +
        `*Телефон:* ${phone}\n` +
        `${email ? `*Email:* ${email}\n` : ""}` +
        `${messenger ? `*Мессенджер:* ${messenger}\n` : ""}` +
        `${budget ? `*Бюджет:* ${budget}\n` : ""}` +
        `${goal ? `*Цель:* ${goal}\n` : ""}` +
        `${creative ? `*Креатив:* ${creative}\n` : ""}` +
        `${offer ? `*Оффер:* ${offer}\n` : ""}` +
        `${comment ? `\n*Комментарий:* ${comment}` : ""}`;

      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      } catch (tgError) {
        console.error("Telegram Error:", tgError);
      }
    }

    return NextResponse.json({ success: true, lead });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
