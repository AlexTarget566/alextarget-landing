import type { Handler } from "@netlify/functions";
import { validateLead } from "../../src/utils/validators";
import type { LeadPayload } from "../../src/types/lead";

const TELEGRAM_API = "https://api.telegram.org/bot";
// n8n создаёт сделку в Битрикс24; ждём не дольше, чтобы уложиться в лимит функции Netlify (10 с)
const B24_TIMEOUT_MS = 7000;

type B24Result = { ok: true; dealUrl?: string } | { ok: false; reason: string };

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// Сделка в Б24 через n8n. Адрес и секрет — в переменных окружения Netlify (B24_LEAD_URL, B24_LEAD_SECRET)
async function sendToB24(lead: LeadPayload): Promise<B24Result> {
  const url = process.env.B24_LEAD_URL;
  const secret = process.env.B24_LEAD_SECRET;
  if (!url || !secret) return { ok: false, reason: "Б24 не настроен" };

  const { consent: _consent, ...fields } = lead;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Lead-Secret": secret },
      body: JSON.stringify(fields),
      signal: AbortSignal.timeout(B24_TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; deal_url?: string; error?: string };
    if (!response.ok || !data.ok) {
      console.error("submit-lead: B24 error", response.status, data.error);
      return { ok: false, reason: `ошибка ${response.status}` };
    }
    return { ok: true, dealUrl: data.deal_url };
  } catch (error) {
    console.error("submit-lead: B24 fetch error", error);
    return { ok: false, reason: "нет ответа" };
  }
}

async function sendToTelegram(lead: LeadPayload, b24: B24Result): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("submit-lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в переменных окружения");
    return false;
  }

  const { name, contact, company, service, comment } = lead;
  const text = [
    "🆕 Новая заявка с сайта AlexTarget",
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    company ? `Компания: ${company}` : null,
    `Услуга: ${service}`,
    comment ? `Комментарий: ${comment}` : null,
    b24.ok ? `✅ Сделка в Б24: ${b24.dealUrl ?? "создана"}` : `⚠️ Не попала в Б24 (${b24.reason}) — завести вручную`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
    });
    if (!response.ok) {
      console.error("submit-lead: Telegram API error", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("submit-lead: fetch error", error);
    return false;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method Not Allowed" });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Некорректный JSON" });
  }

  const result = validateLead(payload);
  if (!result.ok) {
    return jsonResponse(400, { ok: false, errors: result.errors });
  }

  // Сначала Б24 (чтобы в Telegram ушла ссылка на сделку), Telegram — страховка: заявка не теряется,
  // если хотя бы один канал её принял
  const b24 = await sendToB24(result.data);
  const telegramOk = await sendToTelegram(result.data, b24);

  if (!b24.ok && !telegramOk) {
    return jsonResponse(502, { ok: false, error: "Не удалось отправить заявку" });
  }
  return jsonResponse(200, { ok: true });
};
