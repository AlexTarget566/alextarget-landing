import { track, trackCustom } from "../utils/pixel";

// Видео с YouTube («доступ по ссылке»): до клика — только обложка, плеер грузится по нажатию,
// чтобы сайт не тянул YouTube у каждого посетителя. youtube-nocookie — режим без рекламных cookie.
// После запуска считаем, докуда досмотрели (25/50/75/100%): событие в пиксель Meta (аудитория для догона)
// и в Clarity (фильтр записей «досмотрел урок»)

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLIFrameElement, opts: { events: Record<string, () => void> }) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const MILESTONES = [25, 50, 75, 100];

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

function trackProgress(iframe: HTMLIFrameElement): void {
  const sent = new Set<number>();
  const report = (pct: number) => {
    if (sent.has(pct)) return;
    sent.add(pct);
    trackCustom("VideoProgress", { percent: pct, content_name: "video_site" });
    try { window.clarity?.("event", `video_${pct}`); } catch { /* Clarity не загрузился */ }
  };
  loadYouTubeApi().then(() => {
    const player = new window.YT!.Player(iframe, { events: {} });
    const timer = window.setInterval(() => {
      try {
        const dur = player.getDuration();
        if (!dur) return;
        const pct = (player.getCurrentTime() / dur) * 100;
        MILESTONES.filter((m) => pct >= (m === 100 ? 97 : m)).forEach(report);
        if (sent.has(100)) window.clearInterval(timer);
      } catch {
        // плеер ещё не готов
      }
    }, 2000);
  }).catch(() => { /* YouTube API не загрузился — видео играет и без подсчёта */ });
}

export function initVideo(): void {
  const frame = document.querySelector<HTMLElement>(".video__frame");
  const button = frame?.querySelector<HTMLButtonElement>(".video__play");
  const poster = frame?.querySelector<HTMLImageElement>(".video__poster");
  const id = frame?.dataset.youtubeId;
  if (!frame || !button || !id) return;

  // У свежего видео обложки в высоком качестве может ещё не быть — берём стандартную
  poster?.addEventListener("error", () => {
    if (!poster.src.includes("hqdefault")) poster.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }, { once: true });

  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    const origin = encodeURIComponent(window.location.origin);
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`;
    iframe.title = "Как я строю систему продаж с ИИ";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
    track("ViewContent", { content_name: "video_site" });
    try { window.clarity?.("event", "video_start"); } catch { /* Clarity не загрузился */ }
    trackProgress(iframe);
  }, { once: true });
}
