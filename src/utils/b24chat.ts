// Вопрос из формы → первое сообщение в чате Б24 на сайте: ИИ-помощник отвечает сразу, как в начатом разговоре.
// У виджета нет официального «отправить за посетителя», поэтому используем его же поле ввода
// (компонент bx-im-component-textarea → sendMessage) — для Б24 это обычное сообщение посетителя.
// Метод недокументирован: при любой неудаче возвращаем false, и форма идёт запасным путём (сделка + звонок).

interface VueLike {
  $options?: { name?: string };
  $children?: VueLike[];
  currentMessage?: string;
  sendMessage?: (event: { preventDefault(): void }) => void;
}

interface ChatWidget {
  open(): void;
  setUserRegisterData?(data: { name?: string }): void;
  getChatId?(): number;
  template?: { $root?: VueLike } | null;
  rootNode?: HTMLElement | null;
}

let widget: ChatWidget | null = null;

// Виджет сообщает о себе событием onBitrixLiveChat — ловим сразу при загрузке страницы
export function initB24Chat(): void {
  window.addEventListener("onBitrixLiveChat", (event) => {
    widget = (event as CustomEvent<{ widget?: ChatWidget }>).detail?.widget ?? null;
    // Переписка людей не должна попадать в записи Clarity — скрываем окно чата целиком
    widget?.rootNode?.setAttribute("data-clarity-mask", "true");
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor<T>(check: () => T | null | undefined, timeoutMs: number): Promise<T | null> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const value = check();
      if (value) return value;
    } catch {
      // виджет ещё собирается
    }
    await sleep(200);
  }
  return null;
}

function findTextarea(root: VueLike | undefined): VueLike | null {
  if (!root) return null;
  if (root.$options?.name === "bx-im-component-textarea") return root;
  for (const child of root.$children ?? []) {
    const hit = findTextarea(child);
    if (hit) return hit;
  }
  return null;
}

/** Открыть чат и отправить текст от имени посетителя. true — чат создан и сообщение ушло. */
export async function askInChat(text: string, name: string): Promise<boolean> {
  try {
    const w = await waitFor(() => widget, 8000);
    if (!w) return false;
    w.setUserRegisterData?.({ name });
    w.open();
    const textarea = await waitFor(() => findTextarea(w.template?.$root), 10000);
    if (!textarea?.sendMessage) return false;
    textarea.currentMessage = text;
    textarea.sendMessage({ preventDefault() {} });
    return Boolean(await waitFor(() => (Number(w.getChatId?.()) > 0 ? true : null), 15000));
  } catch {
    return false;
  }
}
