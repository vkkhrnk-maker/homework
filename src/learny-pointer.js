function enableLearnyPointer(cursor) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 760px)");
  const pointer = document.createElement("div");
  pointer.id = "playful-pointer"; pointer.className = "playful-pointer";
  pointer.setAttribute("aria-hidden", "true");
  pointer.append(cursor, document.createElement("span"));
  document.body.append(pointer);
  const label = pointer.querySelector("span");
  const labels = {
    learn: { ru:"{Учимся} вместе", en:"{Let's} learn" },
    open: { ru:"{Открыть} урок", en:"{Open} lesson" },
    build: { ru:"{Создать} урок", en:"{Build} lesson" },
    look: { ru:"{Посмотрим}", en:"{Take} a look" }
  };
  let frame = 0, x = 0, y = 0;
  const hide = () => {
    pointer.classList.remove("visible", "pressed");
    if (document.body.classList.contains("has-playful-pointer")) document.body.classList.remove("has-playful-pointer");
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  const draw = () => { frame = 0; pointer.style.transform = `translate(${x}px,${y}px)`; };
  document.addEventListener("pointermove", event => {
    if (!finePointer.matches || event.pointerType === "touch" || !document.body.classList.contains("home")) return hide();
    const target = event.target;
    if (!(target instanceof Element) || target.closest('input,textarea,select,[contenteditable="true"],.sheet-wrap,.ask-overlay')) return hide();
    const control = target.closest("button,a");
    const key = control?.dataset.lesson ? "open" : control?.id === "parse-btn" ? "build" : control ? "look" : "learn";
    label.textContent = labels[key][document.documentElement.lang === "ru" ? "ru" : "en"];
    pointer.classList.toggle("is-action", !!control);
    x = event.clientX; y = event.clientY;
    pointer.classList.toggle("flip-label", x > innerWidth - 150);
    pointer.classList.toggle("lift-label", y > innerHeight - 84);
    pointer.classList.add("visible");
    if (!document.body.classList.contains("has-playful-pointer")) document.body.classList.add("has-playful-pointer");
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive:true });
  document.addEventListener("pointerdown", () => pointer.classList.add("pressed"), { passive:true });
  document.addEventListener("pointerup", () => pointer.classList.remove("pressed"), { passive:true });
  document.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest("#menu-btn,#parse-btn,#material-attach")) hide();
  });
  document.addEventListener("pointerout", event => { if (!event.relatedTarget) hide(); }, { passive:true });
  document.addEventListener("keydown", hide);
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", () => { if (document.hidden) hide(); });
  finePointer.addEventListener("change", hide);
  new MutationObserver(() => { if (!document.body.classList.contains("home")) hide(); }).observe(document.body, { attributes:true, attributeFilter:["class"] });

  return finePointer;
}
