import type { LeadPayload } from "../types/lead";
import { getUtm } from "../utils/utm";
import { metaIds, newEventId, track } from "../utils/pixel";
import { askInChat } from "../utils/b24chat";

type StatusState = "pending" | "success" | "error";

export function initLeadForm(): void {
  const form = document.getElementById("lead-form-el") as HTMLFormElement | null;
  const status = document.getElementById("lead-form-status");
  if (!form || !status) return;

  function showStatus(message: string, state: StatusState) {
    status!.textContent = message;
    status!.dataset.state = state;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);

    // honeypot: если поле заполнено — это бот, тихо "успех", ничего никуда не шлём
    if (String(formData.get("company_site") || "").trim() !== "") {
      showStatus("Заявка отправлена! Я свяжусь с вами в течение 24 часов.", "success");
      form.reset();
      return;
    }

    const eventId = newEventId();
    const payload: LeadPayload = {
      name: String(formData.get("name") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      company: String(formData.get("company") || "").trim() || undefined,
      service: String(formData.get("service") || "").trim(),
      comment: String(formData.get("comment") || "").trim(),
      consent: formData.get("consent") === "on",
      utm: getUtm(),
      meta: metaIds(eventId),
    };

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    submitBtn?.setAttribute("disabled", "true");
    showStatus("Передаю ваш вопрос ИИ-помощнику…", "pending");

    // Сначала чат: вопрос уходит первым сообщением, ИИ-помощник отвечает сразу. Сделку тогда создаёт бот;
    // если чат не открылся — заявка идёт старым путём (сделка из формы + мне «позвонить»)
    const chatOk = await askInChat(`${payload.comment}\n\n— ${payload.name}, ${payload.contact}`, payload.name);
    payload.chat = chatOk ? "ok" : "failed";

    try {
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok && !chatOk) throw new Error("submit-lead request failed");

      track("Lead", { content_name: payload.service }, eventId);

      showStatus(
        chatOk
          ? "Готово! ИИ-помощник уже отвечает в окне чата ↘ Там же договоримся о созвоне."
          : "Заявка отправлена! Я свяжусь с вами в течение 24 часов.",
        "success"
      );
      form.reset();
    } catch {
      showStatus(
        "Не получилось отправить заявку. Напишите мне напрямую — контакты ниже.",
        "error"
      );
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  });

  initPrivacyModal();
}

function initPrivacyModal(): void {
  const modal = document.getElementById("privacy-modal") as HTMLElement | null;
  if (!modal) return;

  const openers = [
    document.getElementById("open-privacy"),
    document.getElementById("open-privacy-footer"),
  ];
  const closers = modal.querySelectorAll<HTMLElement>("[data-close-modal]");

  function open() {
    modal!.hidden = false;
  }

  function close() {
    modal!.hidden = true;
  }

  openers.forEach((btn) => btn?.addEventListener("click", open));
  closers.forEach((el) => el.addEventListener("click", close));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal!.hidden) close();
  });
}
