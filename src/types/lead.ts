import type { Utm } from "../utils/utm";

// Для Conversions API: тот же номер события, что у пикселя (Meta склеит дубль), и cookie пикселя
export interface MetaIds {
  event_id: string;
  fbp?: string;
  fbc?: string;
  url?: string;
}

export interface LeadPayload {
  name: string;
  contact: string;
  company?: string;
  service: string;
  comment?: string;
  consent: boolean;
  utm?: Utm;
  meta?: MetaIds;
}

export const SERVICE_OPTIONS = [
  "Таргетированная реклама (Instagram/Google)",
  "Внедрение ИИ в отдел продаж",
  "Автоматизация бизнес-процессов",
  "Не уверен, нужна консультация",
] as const;
