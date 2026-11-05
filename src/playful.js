/* Оформление пробного варианта. Логика уроков остаётся в общем приложении. */
(() => {
  if (document.documentElement.dataset.style !== "playful") return;
  const svgAssets = {}; // ASSETS_INLINE
  const makeArt = (name, className, width, height) => {
    const holder = document.createElement("div");
    holder.innerHTML = svgAssets[name];
    const svg = holder.firstElementChild;
    svg.setAttribute("class", className); svg.setAttribute("width", width); svg.setAttribute("height", height);
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    svg.dataset.mascot = name;
    return svg;
  };
  const lessonArt = { "past-stories":"book", modals:"bubble", future:"calendar", "culture-b1":"cup", "culture-c1":"globe" };
  const stepArt = { 2:"book", 3:"pencil", 4:"bubble", 5:"microphone", 6:"star" };
  const lessons = document.querySelector("#lesson-list"), how = document.querySelector("#how-list");
  const decorate = () => {
    const brandName = document.querySelector("#brand-name");
    if (brandName.textContent !== "Learny") brandName.textContent = "Learny";
    const brandImage = document.querySelector("#brand-home i img");
    if (brandImage.getAttribute("src") !== "icons/learny-wordmark-v1.png") brandImage.src = "icons/learny-wordmark-v1.png";
    document.querySelectorAll(".footer-name").forEach(name => { if (name.textContent !== "Learny") name.textContent = "Learny"; });
    document.title = document.documentElement.lang === "ru" ? "Learny — практика английского" : "Learny — English practice";
    lessons.querySelectorAll(".lesson-card").forEach(card => {
      const image = card.querySelector("img.lc-art"), name = lessonArt[card.dataset.lesson];
      if (image && name) image.replaceWith(makeArt(name, "lc-art", 132, 132));
    });
    how.querySelectorAll(".how-item").forEach(card => {
      const icon = card.querySelector("svg.ico:not([data-mascot])"), name = stepArt[card.dataset.c];
      if (!icon || !name) return;
      icon.replaceWith(makeArt(name, "ico", 84, 84));
    });
  };
  new MutationObserver(decorate).observe(lessons, { childList:true });
  new MutationObserver(decorate).observe(how, { childList:true, subtree:true });
  decorate();
  const hero = document.querySelector(".intake-copy");
  const eyebrow = hero.querySelector("[data-ui='homeEyebrow']");
  const language = document.createElement("span");
  language.dataset.ui = eyebrow.dataset.ui;
  language.textContent = eyebrow.textContent;
  language.className = "playful-language-bubble";
  language.setAttribute("aria-hidden", "true");
  eyebrow.remove();
  document.querySelector("#brand-home").append(language);
  ["book", "star"].forEach(name => {
    hero.append(makeArt(name, `playful-hero-sticker ${name}`, 142, 142));
  });

  document.querySelectorAll(".material-composer,.topic-composer").forEach(composer => {
    const frame = document.createElement("div"); frame.className = "playful-editor-frame";
    composer.before(frame); frame.append(composer);
    ["tl","tr","bl","br"].forEach(corner => {
      const marker = document.createElement("span"); marker.className = `editor-marker corner-${corner}`;
      marker.setAttribute("aria-hidden", "true"); frame.append(marker);
    });
    const sync = () => { frame.hidden = composer.hidden; };
    new MutationObserver(sync).observe(composer, {attributes:true,attributeFilter:["hidden"]});
    sync();
  });

  const finePointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 760px)");
  const pointer = document.createElement("div");
  pointer.id = "playful-pointer"; pointer.className = "playful-pointer";
  pointer.setAttribute("aria-hidden", "true");
  pointer.append(makeArt("cursor", "playful-pointer-art", 56, 56), document.createElement("span"));
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

  // Пауза хранит текущее время анимации: строка не возвращается к началу при наведении.
  let hoveredCard = null, pausedTrack = null;
  how.addEventListener("pointerover", event => {
    if (!finePointer.matches || event.pointerType === "touch") return;
    const card = event.target instanceof Element ? event.target.closest(".how-item") : null;
    if (!card || card === hoveredCard) return;
    hoveredCard = card;
    const animation = how.querySelector(".how-track")?.getAnimations?.()[0];
    if (animation && animation.playState !== "idle") { animation.pause(); pausedTrack = animation; }
  }, { passive:true });
  how.addEventListener("pointerout", event => {
    const next = event.relatedTarget instanceof Element ? event.relatedTarget.closest(".how-item") : null;
    if (next) { hoveredCard = next; return; }
    hoveredCard = null;
    if (pausedTrack && pausedTrack.playState !== "idle") pausedTrack.play();
    pausedTrack = null;
  }, { passive:true });
  window.addEventListener("blur", () => {
    hoveredCard = null;
    if (pausedTrack && pausedTrack.playState !== "idle") pausedTrack.play();
    pausedTrack = null;
  });
})();
