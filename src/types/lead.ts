export interface LeadPayload {
  name: string;
  contact: string;
  company?: string;
  service: string;
  comment?: string;
  consent: boolean;
}

export const SERVICE_OPTIONS = [
  "Таргетированная реклама (Instagram/Google)",
  "Внедрение ИИ в отдел продаж",
  "Автоматизация бизнес-процессов",
  "Не уверен, нужна консультация",
] as const;
