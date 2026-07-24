import { SERVICE_OPTIONS, type LeadPayload } from "../types/lead";

type ValidationResult =
  | { ok: true; data: LeadPayload }
  | { ok: false; errors: string[] };

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateLead(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Некорректный формат данных"] };
  }

  const record = input as Record<string, unknown>;

  const name = asTrimmedString(record.name);
  const contact = asTrimmedString(record.contact);
  const company = asTrimmedString(record.company);
  const service = asTrimmedString(record.service);
  const comment = asTrimmedString(record.comment);
  const consent = record.consent === true;

  if (!name) errors.push("Укажите имя");
  if (!contact) errors.push("Укажите контакт для связи");
  if (!service || !(SERVICE_OPTIONS as readonly string[]).includes(service)) {
    errors.push("Выберите услугу из списка");
  }
  if (!consent) errors.push("Нужно согласие на обработку персональных данных");

  if (name.length > 120) errors.push("Слишком длинное имя");
  if (contact.length > 160) errors.push("Слишком длинный контакт");
  if (comment.length > 2000) errors.push("Слишком длинный комментарий");

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { name, contact, company: company || undefined, service, comment: comment || undefined, consent },
  };
}
