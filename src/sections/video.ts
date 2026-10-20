import { track } from "../utils/pixel";

// Видео с YouTube («доступ по ссылке»): до клика — только обложка, плеер грузится по нажатию,
// чтобы сайт не тянул YouTube у каждого посетителя. youtube-nocookie — режим без рекламных cookie.
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
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.title = "Как я строю систему продаж с ИИ";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
    track("ViewContent", { content_name: "video_site" });
  }, { once: true });
}
