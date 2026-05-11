import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function GET(req: Request) {
  try {
    // Basic security to avoid unauthorized triggering if needed
    // You can also rely on Vercel Cron secrets or other headers
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Fetch leads where scheduled_date <= now AND reminder_sent is NOT true
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .lte("scheduled_date", now)
      .is("reminder_sent", false)
      .not("scheduled_date", "is", null);

    if (error) {
      console.error("Supabase Error fetching reminders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, message: "No reminders to send" });
    }

    let processedCount = 0;

    for (const lead of leads) {
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const message = `⏰ *НАПОМИНАНИЕ О ЗВОНКЕ*\n\n` +
          `*Имя:* ${lead.name}\n` +
          `*Телефон:* ${lead.phone}\n` +
          `${lead.agent_email ? `*Ответственный:* ${lead.agent_email}\n` : ""}` +
          `\nВремя звонка наступило!`;

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

          // Mark as sent
          await supabase
            .from("leads")
            .update({ reminder_sent: true })
            .eq("id", lead.id);
            
          processedCount++;
        } catch (tgError) {
          console.error("Telegram Error:", tgError);
        }
      } else {
        // If no Telegram env vars are set, just mark as sent to avoid endless loop
        await supabase
          .from("leads")
          .update({ reminder_sent: true })
          .eq("id", lead.id);
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (err) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
