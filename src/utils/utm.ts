// UTM-метки рекламы: читаем из адреса при входе, помним 30 дней (заявку могут оставить не сразу).
// Новый заход с метками перезаписывает старые — в сделку уходит последняя реклама, которая привела человека
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "alextarget_utm";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LEN = 200;

export function captureUtm(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, MAX_LEN);
  }
  if (Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ utm, savedAt: Date.now() }));
  } catch {
    // приватный режим / хранилище запрещено — метки этой заявки просто не сохранятся
  }
}

export function getUtm(): Utm | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { utm: Utm; savedAt: number } | null;
    if (!saved || Date.now() - saved.savedAt > TTL_MS) return undefined;
    return saved.utm;
  } catch {
    return undefined;
  }
}
