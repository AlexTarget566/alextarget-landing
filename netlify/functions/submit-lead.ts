import type { Handler } from "@netlify/functions";
import { validateLead } from "../../src/utils/validators";

const TELEGRAM_API = "https://api.telegram.org/bot";

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("submit-lead: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в переменных окружения");
    return jsonResponse(500, { ok: false, error: "Сервис временно недоступен" });
  }

  const { name, contact, company, service, comment } = result.data;

  const text = [
    "🆕 Новая заявка с сайта AlexTarget",
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    company ? `Компания: ${company}` : null,
    `Услуга: ${service}`,
    comment ? `Комментарий: ${comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("submit-lead: Telegram API error", details);
      return jsonResponse(502, { ok: false, error: "Не удалось отправить заявку" });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error("submit-lead: fetch error", error);
    return jsonResponse(502, { ok: false, error: "Не удалось отправить заявку" });
  }
};
