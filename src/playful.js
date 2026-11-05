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

  const finePointer = enableLearnyPointer(makeArt("cursor", "playful-pointer-art", 56, 56));

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
