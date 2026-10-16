// Пиксель Meta: события для оптимизации рекламы. Базовый код (PageView) — в index.html.
// Lead — успешная заявка с формы; Contact — первый контакт в канале (чат Б24, WhatsApp, Telegram), раз за визит.

type Fbq = (...args: unknown[]) => void;

interface B24Widget {
  subscribe(options: { type: unknown; callback: () => void }): void;
}

declare global {
  interface Window {
    fbq?: Fbq;
    BX?: { LiveChatWidget?: { SubscriptionType?: { userMessage?: unknown } } };
  }
}

export function track(event: string, params: Record<string, string> = {}, eventId?: string): void {
  try {
    if (eventId) window.fbq?.("track", event, params, { eventID: eventId });
    else window.fbq?.("track", event, params);
  } catch {
    // пиксель заблокирован или не загрузился — сайт работает и без него
  }
}

// Один номер события для браузера и сервера — Meta по нему склеит дубль (понадобится для Conversions API)
export function newEventId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const contacted = new Set<string>();

function trackContact(channel: string): void {
  if (contacted.has(channel)) return;
  contacted.add(channel);
  track("Contact", { content_name: channel });
}

const CHANNELS: Array<[RegExp, string]> = [
  [/^https:\/\/wa\.me\//, "whatsapp"],
  [/^https:\/\/t\.me\//, "telegram"],
];

export function initContactTracking(): void {
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const hit = CHANNELS.find(([re]) => re.test(link.href));
    if (hit) trackContact(hit[1]);
  });

  // Виджет Б24 сообщает о себе событием onBitrixLiveChat; ловим первое сообщение посетителя
  window.addEventListener("onBitrixLiveChat", (event) => {
    const widget = (event as CustomEvent<{ widget?: B24Widget }>).detail?.widget;
    const type = window.BX?.LiveChatWidget?.SubscriptionType?.userMessage;
    if (!widget || type === undefined) return;
    widget.subscribe({ type, callback: () => trackContact("b24_chat") });
  });
}
