/* Раскрытие тетради при входе в урок.
   1. Тетрадь выезжает в центр. 2. Обложка перелистывается через корешок и ложится слева,
   на широком экране разворот встает по центру. 3. Камера приближается к правой странице,
   пока та не займет весь экран, и открывается урок.
   Если в системе отключено движение, переход обычный. */
window.openNotebook = function (sheet, href) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { location.href = href; return; }
  const make = name => Object.assign(document.createElement("div"), { className: name });
  const r = sheet.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const dim = make("nb-dim"), stage = make("nb-stage"), page = make("nb-page"), leaf = make("nb-leaf"), inside = make("nb-inside");
  stage.dataset.look = "cover";
  stage.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  stage.style.setProperty("--c", getComputedStyle(sheet).getPropertyValue("--c").trim() || "#e9e6dc");
  leaf.append(sheet.cloneNode(true), inside);
  stage.append(page, leaf);
  document.body.append(dim, stage);
  sheet.style.visibility = "hidden";

  // разворот в два листа помещается только на широком экране; на телефоне по центру остается правая страница
  const spreadScale = Math.min(vh * .74 / r.height, vw * .92 / (2 * r.width));
  const spread = spreadScale >= 1;
  const s = spread ? spreadScale : Math.max(1, Math.min(vh * .74 / r.height, vw * .86 / r.width));
  const dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
  const openDx = spread ? dx + s * r.width / 2 : dx;
  const zoom = Math.max(vw / r.width, vh / r.height) * 1.06;
  const ease = "cubic-bezier(.2,0,0,1)", total = 1250;

  dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: ease, fill: "forwards" });
  leaf.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }], { duration: 520, delay: 300, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" });
  page.animate([{ backgroundColor: "#fffdf8" }, { backgroundColor: "#f6f4ec" }], { duration: 300, delay: 930, easing: ease, fill: "forwards" });
  // разворот на мгновение замирает открытым, прежде чем камера уходит в страницу
  stage.animate([
    { transform: "translate(0,0) scale(1)", easing: ease },
    { transform: `translate(${dx}px,${dy}px) scale(${s})`, offset: .27, easing: "cubic-bezier(.5,0,.2,1)" },
    { transform: `translate(${openDx}px,${dy}px) scale(${s})`, offset: .66 },
    { transform: `translate(${openDx}px,${dy}px) scale(${s})`, offset: .74, easing: "cubic-bezier(.6,0,.3,1)" },
    { transform: `translate(${dx}px,${dy}px) scale(${zoom})` }
  ], { duration: total, fill: "forwards" }).finished.then(() => { location.href = href; });
};
// при возврате назад страница показывается из кеша: убираем следы перехода
addEventListener("pageshow", () => {
  document.querySelectorAll(".nb-dim,.nb-stage").forEach(el => el.remove());
  document.querySelectorAll(".lp-sheet").forEach(el => { el.style.visibility = ""; });
});
