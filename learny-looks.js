// Стилистика лендинга Learny (вид G, утвержден 23 ноября 2026); стили — learny-looks.css, правила — DESIGN.md.
// Скрипт ставит атрибуты состояния на <html>, раскладывает первый экран и шапку и плавно меняет цвет стола в сцене.
// learnyLook() вызывается после каждой смены языка, до подгонки крупных строк по ширине.
(() => {
  const root = document.documentElement;
  // зеленая обложка, яркие столы в сцене, облегченная картотека, первый экран «надпись и тетрадь под ней»
  Object.assign(root.dataset, { cover: "green", desk: "bright", shelf: "b", hero: "b" });
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // Закрытая тетрадь на первом экране: на компьютере лежит под второй строкой заголовка, хвосты букв заходят на нее,
  // низ уходит за край; на телефоне — по центру прямо под заголовком, описание и кнопка внизу экрана
  window.learnyHero = ({ W, H, w, h, mobile }) => {
    const copy = document.getElementById("copy"), title = copy.querySelector("h1");
    const top = copy.offsetTop + title.offsetTop + title.offsetHeight - (mobile ? 8 : 6);
    if (mobile) {
      const bottom = copy.offsetTop + copy.querySelector(".lede").offsetTop - 20;
      const s = Math.max(.4, Math.min(W * .86 / w, (bottom - top) / h));
      return { s, a: -5, cx: W / 2, cy: top + h * s / 2 };
    }
    const s = Math.min(H * .66 / h, W * .3 / w);
    return { s, a: -6, cx: W * .5, cy: top + h * s / 2 };
  };

  // «What are we learning?» в две строки: строки делятся поровну по длине, размер — по более длинной строке,
  // но не выше пятой части экрана, чтобы поле, варианты и кнопка оставались на том же экране
  function sizeOwn() {
    const ownH = document.getElementById("own-h");
    if (!ownH || !ownH.children.length) return;
    // на телефоне у заголовка общий калибр разделов (learny-looks.css, «Телефон: один калибр заголовка»)
    if (matchMedia("(max-width:600px)").matches) { ownH.style.fontSize = ""; return; }
    ownH.style.fontSize = "100px";
    let longest = 0;
    [...ownH.children].forEach(line => { const r = document.createRange(); r.selectNodeContents(line); longest = Math.max(longest, r.getBoundingClientRect().width); });
    if (!longest) return;
    // по высоте — не больше пятой части экрана: при трети (было .29) в окне ниже 900 px поле, варианты и кнопка уходили за край
    const byWidth = ownH.clientWidth * .99 / longest * 100, byHeight = innerHeight * (innerWidth > 900 ? .19 : .15);
    ownH.style.fontSize = Math.min(byWidth, byHeight).toFixed(1) + "px";
  }
  addEventListener("resize", sizeOwn);
  document.fonts?.ready.then(sizeOwn);

  window.learnyLook = () => {
    const ru = root.lang === "ru";
    // H1 подгоняется под всю ширину: узкому шрифту не нужна поправка Литераты на плотную кириллицу
    const h1 = document.querySelector(".ld-copy h1");
    if (h1) h1.dataset.fit = innerWidth > 900 ? (ru ? "1.11" : "1") : ru ? ".97" : ".72";
    // Карточка слова на странице теории — карточка для слов на кольце (тот же элемент .wcard, чтобы сохранилось
    // его появление по ходу листания); перевод над словом и сноску сравнили и отклонили
    const wc = document.querySelector(".ld-demo .wcard");
    if (wc && !wc.dataset.lk) {
      wc.dataset.lk = "ring";
      wc.className = "lk-ring";
      wc.innerHTML = '<span class="lk-ring-card"><b>seatbelt</b><i>ремень безопасности</i></span><span class="lk-ring-loop" aria-hidden="true"></span>';
    }
    // Тетрадь на зеленой обложке розовая: фиолетовый на зеленом тускнеет. Тот же урок в картотеке («Modal verbs») тоже
    // розовый: меняется цветом с «My culture, B1»
    if (!root.dataset.recolored) {
      root.dataset.recolored = "1";
      document.getElementById("nb")?.style.setProperty("--c", "#f2619c");
      const rows = document.querySelectorAll("#shelf > li");
      if (rows[0] && rows[3]) { rows[0].style.setProperty("--c", "#f2619c"); rows[3].style.setProperty("--c", "#6f45e8"); }
    }
    const ownH = document.getElementById("own-h");
    if (ownH) {
      ownH.removeAttribute("data-fit");
      const words = ownH.textContent.trim().split(/\s+/);
      let cut = 1, worst = Infinity;
      for (let i = 1; i < words.length; i++) {
        const m = Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length);
        if (m < worst) { worst = m; cut = i; }
      }
      if (words.length > 1) ownH.innerHTML = `<span>${esc(words.slice(0, cut).join(" "))}</span><span>${esc(words.slice(cut).join(" "))}</span>`;
      sizeOwn();
    }
    // «Свой урок» в картотеке: заголовок не повторяет ярлычок — в нем то, из чего урок делается; вместо крупного слова,
    // как у других уроков, крупная стрелка вниз: разделитель ведет к блоку «свой урок»
    const ownRow = document.querySelector("#shelf > li.own");
    if (ownRow) {
      const b = ownRow.querySelector(".ld-nbbody b"), small = ownRow.querySelector(".ld-nbbody small");
      if (b && small) { b.removeAttribute("data-t"); b.textContent = small.textContent; small.hidden = true; }
      if (!ownRow.querySelector(".ld-nbclip")) ownRow.querySelector(".ld-nbrow")?.insertAdjacentHTML("beforeend", '<span class="ld-nbclip" aria-hidden="true"><span class="nb-word lk-own-arrow">↓</span></span>');
    }
    // «пять шагов» один раз — в описании картотеки, а не в каждом уроке
    const lp = document.querySelector('[data-t="lessonsP"]');
    if (lp) lp.textContent = ru ? "Откройте любую тетрадь: в каждой целый урок из пяти шагов" : "Open any notebook. Each one is a complete lesson in five steps";
    window.learnyGrid?.();
    // шапка: ссылки и язык — в одну плашку по центру, «Кабинет» остается справа
    const nav = document.querySelector(".ld-nav");
    if (nav && !nav.querySelector(".lk-notch")) {
      const notch = document.createElement("span");
      notch.className = "lk-notch";
      nav.prepend(notch);
      notch.append(...[...nav.children].filter(el => el !== notch && !el.classList.contains("ld-space")));
    }
  };

  // Текст на страницах тетради стоит на рядах точек: базовая линия первой строки каждого текстового блока сдвигается
  // на ближайший ряд (ряды — через шаг .78em тетради от верха страницы; у изнанки обложки бумага наклеена со сдвигом 1,5%).
  // Сдвиг — свойством translate: оно не меняет раскладку, поэтому повторный расчет дает то же самое
  const GRID_TEXT = ".ld-n, .ld-back h3, .ld-back p, .rule-h, .rule-g, .ex, .sentence, .ask, .note, .print, .rep, .ld-answers li, .tally, .sent, .tale";
  const alignGrid = () => document.querySelectorAll(".ld-nb .ld-face").forEach(face => {
    const g = parseFloat(getComputedStyle(face).fontSize) * .78;
    const oy = face.matches(".ld-cover .ld-back") ? face.offsetHeight * .015 : 0;
    if (!g || !face.offsetHeight) return;
    face.querySelectorAll(GRID_TEXT).forEach(el => {
      if (el.closest(".lk-ring, .wcard")) return;
      const host = el.matches("li, .note") ? el.querySelector("span") || el : el;
      const mark = document.createElement("span");
      mark.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
      host.prepend(mark);
      let y = 0, n = mark;
      while (n && n !== face) { y += n.offsetTop; n = n.offsetParent; }
      mark.remove();
      if (n !== face) return;
      const d = Math.round((y - oy) / g) * g + oy - y;
      el.style.translate = `0 ${d.toFixed(2)}px`;
    });
  });
  let gridFrame = 0;
  const queueGrid = () => { cancelAnimationFrame(gridFrame); gridFrame = requestAnimationFrame(() => requestAnimationFrame(alignGrid)); };
  window.learnyGrid = queueGrid;
  addEventListener("resize", queueGrid);
  document.fonts?.ready.then(queueGrid);
  addEventListener("load", queueGrid);

  // Проба логотипа одинарным контуром в шапке: ?logo=line
  if (new URLSearchParams(location.search).get("logo") === "line") root.dataset.logo = "line";

  // Легкое зерно на больших цветных поверхностях — глубина цвета, как в печатной иллюстрации (выбрано Викторией 24 ноября 2026)
  root.dataset.grain = "1";

  // Марка в футере нарисована двойным контуром, чуть неровным, как от руки, и дорисовывается карандашом, когда футер
  // появляется (выбрано Викторией 24 ноября 2026; сплошную марку сравнили и отклонили)
  {
    root.dataset.foot = "b";
    addEventListener("DOMContentLoaded", () => {
      const mark = document.querySelector(".lk-foot-mark");
      if (!mark) return;
      fetch(mark.ownerDocument.baseURI.replace(/[^/]*$/, "") + "icons/learny-wordmark.svg").then(r => r.text()).then(svg => {
        const d = (svg.match(/ d="([^"]+)"/) || [])[1], vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
        if (!d || !vb) return;
        mark.innerHTML = `<svg viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="lk-hand" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs><g filter="url(#lk-hand)"><path class="lk-line-out" pathLength="1" vector-effect="non-scaling-stroke" d="${d}"/><path class="lk-line-in" pathLength="1" vector-effect="non-scaling-stroke" d="${d}"/></g></svg>`;
        const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { mark.classList.add("is-drawn"); io.disconnect(); } }), { threshold: .35 });
        io.observe(mark);
      });
    });
  }

  // Наклейки в футере: нажатие переворачивает (на обороте перевод), перетаскивание двигает. Сдвиг хранится в --dx/--dy,
  // поворот остается свой; последняя тронутая — сверху. После перетаскивания наклейка не переворачивается
  addEventListener("DOMContentLoaded", () => {
    let top = 3;
    document.querySelectorAll(".lk-st").forEach(st => {
      let x0 = 0, y0 = 0, dx = 0, dy = 0, sx = 0, sy = 0, dragged = false;
      const move = e => {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > 5) dragged = true;
        dx = e.clientX - x0; dy = e.clientY - y0;
        st.style.setProperty("--dx", dx + "px");
        st.style.setProperty("--dy", dy + "px");
      };
      const drop = () => {
        st.classList.remove("is-dragging");
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", drop);
        removeEventListener("pointercancel", drop);
      };
      st.addEventListener("pointerdown", e => {
        if (e.button) return;
        e.preventDefault();
        x0 = e.clientX - dx; y0 = e.clientY - dy; sx = e.clientX; sy = e.clientY;
        dragged = false;
        st.classList.add("is-dragging");
        st.style.zIndex = ++top;
        addEventListener("pointermove", move);
        addEventListener("pointerup", drop);
        addEventListener("pointercancel", drop);
      });
      st.addEventListener("click", () => {
        if (dragged) { dragged = false; return; }
        st.classList.toggle("is-flipped");
        st.setAttribute("aria-pressed", String(st.classList.contains("is-flipped")));
      });
    });
  });

  // Цвет стола в сцене: переход между цветами шагов и с обложки на стол идет в oklch по короткой дуге оттенка.
  // Обычный переход через sRGB давал грязную середину: зеленый с желтым — оливковый, зеленый с розовым — серо-сиреневый
  addEventListener("DOMContentLoaded", () => {
    const pin = document.getElementById("pin");
    if (!pin) return;
    const toLin = c => (c /= 255) <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
    const hexToOklch = hex => {
      const m = hex.trim().replace("#", "").match(/^([0-9a-f]{6})/i);
      if (!m) return null;
      const n = parseInt(m[1], 16), r = toLin(n >> 16 & 255), g = toLin(n >> 8 & 255), b = toLin(n & 255);
      const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), mm = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
      const L = .2104542553 * l + .793617785 * mm - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * mm + .4505937099 * s, B = .0259040371 * l + .7827717662 * mm - .808675766 * s;
      return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
    };
    const shown = () => (pin.classList.contains("lit") ? getComputedStyle(pin).getPropertyValue("--stage") : getComputedStyle(document.documentElement).getPropertyValue("--cover") || getComputedStyle(pin).getPropertyValue("--stage")).trim();
    let cur = hexToOklch(shown()), raf = 0;
    const paint = c => pin.style.setProperty("--desk-now", `oklch(${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(2)})`);
    const mix = (a, b, k) => {
      let dh = b[2] - a[2];
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, ((a[2] + dh * k) % 360 + 360) % 360];
    };
    // Конец сцены: пока картотека подъезжает снизу, стол перетекает в ее лайм вслед за прокруткой, и картотека выезжает
    // уже на свой цвет, без стыка фиолетового с лаймом. Ниже блоки по-прежнему встык: там цвет делит зоны, а не шаги урока
    const shelf = document.getElementById("lessons");
    let handoff = 0;
    const show = () => {
      if (!cur) return;
      const lime = handoff && hexToOklch(getComputedStyle(document.documentElement).getPropertyValue("--acc"));
      paint(lime ? mix(cur, lime, handoff) : cur);
    };
    const toShelf = () => {
      if (!shelf) return;
      const H = innerHeight, k = Math.min(1, Math.max(0, (H * 1.45 - shelf.getBoundingClientRect().top) / (H * .45)));
      const eased = k * k * (3 - 2 * k);
      if (Math.abs(eased - handoff) < .002) return;
      handoff = eased;
      show();
    };
    addEventListener("scroll", toShelf, { passive: true });
    addEventListener("resize", toShelf);
    toShelf();
    if (cur) show();
    const go = () => {
      const target = hexToOklch(shown());
      if (!target || !cur) return;
      const from = cur.slice(), t0 = performance.now(), dur = 600;
      let dh = target[2] - from[2];
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
      // путь через желто-оливковые оттенки (70–115°) на средней светлоте дает горчицу: если ни один конец не желтый, идем другой дугой
      const inBand = h => h >= 70 && h <= 115, passes = (h0, d) => { for (let k = 0; k <= 20; k++) if (inBand(((h0 + d * k / 20) % 360 + 360) % 360)) return true; return false; };
      if (!inBand(from[2]) && !inBand(target[2]) && passes(from[2], dh)) dh = dh > 0 ? dh - 360 : dh + 360;
      cancelAnimationFrame(raf);
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        // светлота идет быстрее к светлому концу: середина перехода остается светлой и чистой, без грязи
        const eL = target[0] > from[0] ? 1 - (1 - k) ** 3 : k ** 3;
        cur = [from[0] + (target[0] - from[0]) * eL, from[1] + (target[1] - from[1]) * e, ((from[2] + dh * e) % 360 + 360) % 360];
        show();
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    new MutationObserver(go).observe(pin, { attributes: true, attributeFilter: ["data-step", "class"] });
  });
})();
