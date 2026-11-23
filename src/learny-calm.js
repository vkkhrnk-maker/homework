// Learny, спокойная проба: вход в готовый урок для гостя, раздел «Как устроен урок», варианты первого экрана.
(() => {
  const DEMO_LESSON = "modals"; // встроенный урок с вариантами ответа: первый вопрос решается двумя тапами
  const hero = document.documentElement.dataset.hero || "b";
  const $one = selector => document.querySelector(selector);

  // Заголовки вариантов первого экрана: раскладку и текст можно выбирать независимо.
  const HERO_COPY = {
    a: {},
    b: {
      learnyTitleStart: { ru: "Домашка по английскому,", en: "English homework," },
      learnyTitleEnd: { ru: "шаг за шагом", en: "step by step" },
      homeLede: {
        ru: "Learny превращает заметки учителя в урок: теория, упражнения и разговорная практика.",
        en: "Learny turns your teacher’s notes into a lesson: theory, exercises and speaking practice."
      }
    },
    c: {
      learnyTitleStart: { ru: "Что учим", en: "What are you" },
      learnyTitleEnd: { ru: "сегодня?", en: "learning today?" },
      homeLede: {
        ru: "Вставьте заметки учителя или назовите тему. Learny соберет теорию, упражнения и разговорную практику.",
        en: "Paste your teacher’s notes or name a topic. Learny builds the theory, exercises and speaking practice."
      },
      intakePlaceholder: { ru: "Например, «Когда употреблять present perfect?»", en: "For example, “When do I use the present perfect?”" }
    }
  };
  Object.assign(UI, {
    calmDemo: { ru: "Открыть готовый урок", en: "Try a sample lesson" },
    calmOwnLink: { ru: "Создать свой урок", en: "Create my own lesson" },
    calmSampleLink: { ru: "Открыть пример", en: "Open sample lesson" },
    calmOwnTitle: { ru: "Урок из текста", en: "A lesson from your text" },
    // Над полем — одно предложение о том, что делать; куда уходит текст — подписью под кнопкой.
    calmOwnLede: { ru: "Вставьте домашку от учителя или назовите тему.", en: "Paste your teacher’s homework or name a topic." },
    calmOwnNote: {
      // Ключ не нужен: без своего ключа текст уходит на сервер Learny. Со своим ключом строка честно говорит другое.
      ru: () => aiKey()
        ? "Текст отправится напрямую в ИИ по вашему ключу."
        : "Текст отправится на сервер Learny и в Google Gemini для разбора.",
      en: () => aiKey()
        ? "Your text goes straight to the AI under your own key."
        : "Your text is sent to the Learny server and Google Gemini to build the lesson."
    },
    calmTrLabel: { ru: "Перевод теории", en: "Theory translation" },
    calmTrTap: { ru: "По тапу", en: "On tap" },
    calmTrShow: { ru: "Сразу", en: "Always" },
    calmSampleLabel: { ru: "Вопрос из готового урока", en: "A question from a sample lesson" },
    cabinet: { ru: "Кабинет", en: "My space" },
    cabinetTitle: { ru: "Мой кабинет", en: "My learning space" },
    cabinetContinue: { ru: "Продолжить урок", en: "Continue lesson" },
    // ссылка называется так же, как страница, на которую ведет («Sample lessons»)
    cabinetCatalog: { ru: "Готовые уроки", en: "Sample lessons" },
    cabinetEmpty: { ru: "Здесь появятся уроки, которые вы открыли или создали.", en: "Lessons you open or create will appear here." },
    cabinetLocal: { ru: "Уроки и прогресс сохраняются в этом браузере.", en: "Your lessons and progress are saved in this browser." },
    cabinetStageEnd: { ru: "Итоги этапа", en: "Stage results" },
    // Сохранение кабинета по личному коду: без почты и пароля.
    syncBtn: { ru: "Сохранить кабинет", en: "Save my space" },
    syncOn: { ru: "по личному коду", en: "under your code" },
    syncOff: { ru: "только в этом браузере", en: "this browser only" },
    spaceSave: { ru: "Сохранить кабинет", en: "Save my space" },
    spaceShow: { ru: "Показать код", en: "Show my code" },
    spaceLocal: { ru: "Кабинет сохранен только в этом браузере", en: "Your space is saved in this browser only" },
    spaceSavedLine: { ru: "Кабинет сохранен по личному коду", en: "Your space is saved under your personal code" },
    spaceLead: {
      ru: "Уроки, прогресс и словарь сохранятся по личному коду. Почта и пароль не нужны.",
      en: "Your lessons, progress and vocabulary are kept under a personal code. No email, no password."
    },
    spaceCreate: { ru: "Создать код", en: "Create my code" },
    spaceHave: { ru: "У меня уже есть код", en: "I already have a code" },
    spaceCodeLabel: { ru: "Личный код", en: "Personal code" },
    spaceOpen: { ru: "Открыть кабинет", en: "Open my space" },
    spaceSavedTitle: { ru: "Кабинет сохранен", en: "Your space is saved" },
    spaceKeep: {
      ru: "Сохраните код: по нему кабинет откроется на другом устройстве или после очистки браузера.",
      en: "Keep this code: it opens your space on another device or after the browser is cleared."
    },
    spaceCopyCode: { ru: "Скопировать код", en: "Copy code" },
    spaceCopyLink: { ru: "Скопировать ссылку", en: "Copy link" },
    spaceCopied: { ru: "Скопировано", en: "Copied" },
    spaceOff: { ru: "Отключить на этом устройстве", en: "Turn off on this device" },
    spaceOffDone: { ru: "Отключено. Кабинет остался в этом браузере", en: "Turned off. Your space stays in this browser" },
    spaceBusy: { ru: "Сохраняем…", en: "Saving…" },
    spaceFail: {
      ru: "Не получилось связаться с сервером. Кабинет остался в этом браузере.",
      en: "Couldn’t reach the server. Your space is still in this browser."
    },
    spaceBad: { ru: "Такой код не найден", en: "This code wasn’t recognised" },
    spaceEmpty: {
      ru: "По этому коду кабинет пуст. Проверьте код: возможно, в нем опечатка.",
      en: "There’s nothing under this code yet. Check it for a typo."
    },
    spaceShort: { ru: "Проверьте код: в нем 15 знаков", en: "Check the code: it has 15 characters" },
    calmReview: { ru: "Повторение", en: "Review" },
    calmStepMatch: { ru: "Мини-истории", en: "Mini-stories" },
    calmSamples: { ru: "Готовые уроки", en: "Sample lessons" },
    calmSampleNote: { ru: "Выберите слово, урок откроется на этом вопросе", en: "Pick a word and the lesson opens on this question" }
  }, HERO_COPY[hero] || {});

  function translated(tag, key, className) {
    const el = document.createElement(tag);
    el.dataset.ui = key;
    el.textContent = t(key);
    el.className = className;
    return el;
  }

  function openDemo(answer) {
    const l = LESSONS.find(item => item.id === DEMO_LESSON);
    if (!l) return;
    openLesson(DEMO_LESSON, typeof answer === "string" || !startedLesson(l) ? "drill" : savedStage(l));
    if (typeof answer !== "string") return;
    // слово с витрины подставляем, только если открылся тот же первый вопрос
    if ($one("#drill-dots .dot-q.current")?.dataset.i !== "0") return;
    const selected = [...document.querySelectorAll("#drill-card .chip")].find(chip => chip.dataset.chip === answer);
    if (selected) {
      selected.click();
      selected.focus({ preventScroll: true });
    }
  }

  /* ---------- первый экран ---------- */
  const intake = $one(".intake");
  const copy = $one(".intake-copy");
  const dropCard = $one(".drop-card");
  const actions = document.createElement("div");
  actions.className = "learny-hero-actions";
  const demo = document.createElement("button");
  demo.type = "button";
  demo.className = "learny-demo";
  const arrow = document.createElement("span");
  arrow.className = "learny-demo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  demo.append(translated("span", hero === "b" ? "calmSampleLink" : "calmDemo", ""), arrow);
  demo.addEventListener("click", () => openDemo());
  actions.append(demo);
  (hero === "c" ? dropCard : copy).append(actions);

  if (hero === "b") {
    const sampleLesson = LESSONS.find(item => item.id === DEMO_LESSON);
    const question = sampleLesson?.drill?.items?.[0];
    if (question) {
      const sample = document.createElement("div");
      sample.className = "learny-sample";
      const sentence = document.createElement("p");
      sentence.className = "learny-sample-q";
      const blank = document.createElement("span");
      blank.className = "blank";
      blank.innerHTML = "&nbsp;";
      sentence.append(stripTags(question.s[0]), blank, stripTags(question.s[1]));
      const chips = document.createElement("div");
      chips.className = "learny-sample-chips";
      for (const word of drillChoices(sampleLesson, 0)) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = word;
        chip.addEventListener("click", () => openDemo(word));
        chips.append(chip);
      }
      sample.append(translated("span", "calmSampleLabel", "learny-sample-label"), sentence, chips, translated("p", "calmSampleNote", "learny-sample-note"), demo);
      intake.append(sample);
      // карандаш — персонаж шага «Practise», поэтому он сидит на карточке с вопросом
      const pencil = $one(".learny-editor-pencil");
      if (pencil) sample.append(pencil);
    }
    const ownLink = translated("button", "calmOwnLink", "primary-btn learny-own-link");
    ownLink.type = "button";
    actions.prepend(ownLink);
  }

  /* ---------- «Как устроен урок»: открытый раздел вместо раскрывашки ---------- */
  const steps = $one(".learny-guide-steps");
  const inside = document.createElement("section");
  inside.className = "learny-inside";
  const insideTitle = translated("h2", "learnyGuide", "learny-inside-title");
  insideTitle.id = "learny-inside-title";
  inside.setAttribute("aria-labelledby", insideTitle.id);
  inside.append(insideTitle, steps);
  $one(".learny-guide").remove();
  const library = $one("#learny-library");
  if (hero !== "b") {
    function arrangeComparison() {
      const hasOwn = LESSONS.some(l => l.own);
      const order = hasOwn ? [library, inside] : [inside, library];
      intake.after(...order);
      const title = $one("#learny-library-title");
      title.dataset.ui = hasOwn ? "lessonsLabel" : "calmSamples";
      title.textContent = t(title.dataset.ui);
    }
    document.addEventListener("lessonviewchange", ({detail}) => { if (detail === "home") arrangeComparison(); });
    arrangeComparison();
  }
  /* ---------- маскот шага в уроке: тот же персонаж, что и в «Как устроен урок» ---------- */
  // шаги на главной называются так же, как вкладки урока: Theory, Practice, Mini-stories, Speaking.
  // Третий шаг — «Mini-stories», как в большинстве уроков; общее «Meanings» (navMatch) остается запасным названием вкладки
  ["navTheory", "navDrill", "calmStepMatch", "navSpeak", "navReport"].forEach((key, index) => {
    const title = steps.querySelectorAll(".learny-step-title")[index];
    if (!title || !UI[key]) return;
    title.dataset.ui = key;
    title.textContent = t(key); // раздел еще не в документе, общий applyLang до него не дотянется
  });
  const art = [...steps.querySelectorAll(".learny-step-art")];
  ["theory", "drill", "match", "speak"].forEach((stage, index) => {
    const heading = $one(`#view-${stage} .section-heading`);
    if (!heading || !art[index]) return;
    const template = document.createElement("template");
    // у копии свои id масок и обтравок, иначе она зависит от скрытого оригинала
    template.innerHTML = art[index].outerHTML.replace(/\b(id="|url\(#|href="#)(learny-mascot-)/g, "$1calm-$2");
    const mascot = template.content.firstElementChild;
    mascot.setAttribute("class", "learny-step-mascot");
    heading.prepend(mascot);
  });

  // На телефоне «Check» и «Next» прибиты к низу экрана: панель появляется, когда на шаге есть такое действие.
  const actionBar = document.createElement("div");
  actionBar.className = "learny-actionbar";
  actionBar.setAttribute("aria-hidden", "true");
  document.body.append(actionBar);
  const pinned = ":is(#view-drill, #view-match):not([hidden]) :is(#drill-card .answer-row .primary-btn, #drill-card .nav-row .primary-btn, #match-card .nav-row .primary-btn), "
    // в «Говорении» внизу — запись (или «Next», когда ответ уже есть), во время записи — «Stop»
    + "#view-speak:not([hidden]) :is(#speak-card .nav-row .primary-btn, #speak-card #s-rec, #speak-card #s-stop)";
  // Линия над панелью — только когда под нее уходит содержимое шага; на коротком экране панель сливается с фоном.
  const syncCover = () => {
    const stage = $one(".learny-stage:not([hidden])");
    if (!stage || !document.body.classList.contains("has-action")) { actionBar.classList.remove("is-covering"); return; }
    const end = stage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(stage).paddingBottom);
    actionBar.classList.toggle("is-covering", end > actionBar.getBoundingClientRect().top + 1);
  };
  let coverFrame = 0;
  const queueCover = () => { if (!coverFrame) coverFrame = requestAnimationFrame(() => { coverFrame = 0; syncCover(); }); };
  // Итог ответа — внизу, у кнопки «Next», как у Speak и Duolingo: полоса в цвете результата и вердикт; в карточке остается разбор.
  // Полоса декоративная (aria-hidden): для скринридера вердикт по-прежнему объявляет карточка.
  const barVerdict = document.createElement("span");
  barVerdict.className = "learny-actionbar-verdict";
  actionBar.append(barVerdict);
  const syncVerdict = () => {
    const feedback = $one("#view-drill:not([hidden]) #drill-feedback .feedback");
    const result = feedback ? (feedback.classList.contains("bad") ? "bad" : "good") : "";
    actionBar.dataset.result = result;
    document.body.classList.toggle("has-result", !!result && document.body.classList.contains("has-action"));
    barVerdict.textContent = feedback?.querySelector(".verdict")?.textContent.trim() || "";
  };
  const syncAction = () => { document.body.classList.toggle("has-action", !!$one(pinned)); syncVerdict(); queueCover(); };
  for (const id of ["#drill-card", "#match-card", "#speak-card"]) new MutationObserver(syncAction).observe($one(id), { childList: true, subtree: true });
  // Теория на телефоне: «Fix» виден у того блока, по которому нажали, а не у всех семнадцати сразу
  document.addEventListener("pointerdown", event => {
    const use = event.target.closest?.("#theory-body .use");
    if (!use) return;
    document.querySelectorAll("#theory-body .use.is-active").forEach(other => { if (other !== use) other.classList.remove("is-active"); });
    use.classList.add("is-active");
  });
  document.addEventListener("lessonviewchange", syncAction);
  window.addEventListener("scroll", queueCover, { passive: true });
  window.addEventListener("resize", queueCover);

  /* ---------- меню: заголовок «Learny» только для скринридера, «Reset lesson» в самом низу и красным,
     перевод теории — сегментом, как язык подсказок и тема, а не строкой, которая меняет надпись по нажатию ---------- */
  $one("#menu-title").classList.add("learny-visually-hidden");
  const resetButton = $one("#reset-btn");
  resetButton.classList.add("dz", "learny-menu-last");
  $one("#menu .opts").append(resetButton);
  const trButton = $one("#tr-btn");
  trButton.classList.add("learny-replaced");
  const trLabel = translated("div", "calmTrLabel", "sh-sub");
  const trSegment = document.createElement("div");
  trSegment.className = "seg";
  trSegment.setAttribute("role", "group");
  trSegment.setAttribute("aria-labelledby", "learny-tr-label");
  trLabel.id = "learny-tr-label";
  const trOptions = [["click", "calmTrTap"], ["show", "calmTrShow"]].map(([mode, key]) => {
    const option = translated("button", key, "");
    option.type = "button";
    option.dataset.trMode = mode;
    option.addEventListener("click", () => { lsSet("et-tr", mode); renderTheory(); syncTranslation(); });
    return option;
  });
  trSegment.append(...trOptions);
  $one('#menu .sh-sub[data-ui="langLabel"]').before(trLabel, trSegment);
  function syncTranslation() {
    trLabel.hidden = trSegment.hidden = trButton.hidden;
    trOptions.forEach(option => option.setAttribute("aria-pressed", String(option.dataset.trMode === trMode())));
  }
  new MutationObserver(syncTranslation).observe(trButton, { attributes: true, attributeFilter: ["hidden"] });
  syncTranslation();

  /* ---------- режим урока на телефоне ----------
     Вместо шапки приложения, «← My space» и вкладок шагов — одна строка: «×» (в кабинет), название шага со списком шагов, «…» (меню урока).
     Номера вопросов становятся сегментами полосы прогресса (это стили). На компьютере все как было. */
  const phone = matchMedia("(max-width: 800px)");
  const lessonContext = $one(".learny-lesson-context");
  const menuButton = $one("#menu-btn");
  const menuHome = $one(".header-actions");
  const stepSwitch = document.createElement("button");
  stepSwitch.type = "button";
  stepSwitch.className = "learny-step-switch";
  stepSwitch.setAttribute("aria-haspopup", "dialog");
  const stepLabel = document.createElement("span");
  const stepCaret = document.createElement("span");
  stepCaret.className = "learny-step-caret";
  stepCaret.setAttribute("aria-hidden", "true");
  stepSwitch.append(stepLabel, stepCaret);
  lessonContext.querySelector(".learny-back").after(stepSwitch);
  const stepTabs = () => [...document.querySelectorAll("#tabs .tab[data-view]")].filter(tab => tab.dataset.view !== "home");
  const tabName = tab => [...tab.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent).join("").trim();
  function syncLessonTop() {
    const lessonMode = phone.matches && !$one("#tabs-row").hidden;
    document.body.classList.toggle("learny-lesson-mode", lessonMode);
    const place = lessonMode ? lessonContext : menuHome;
    if (menuButton.parentElement !== place) place.append(menuButton);
    const current = stepTabs().find(tab => tab.getAttribute("aria-selected") === "true");
    stepLabel.textContent = current ? tabName(current) : ($one("#view-report:not([hidden]) h1")?.textContent || "");
    stepSwitch.setAttribute("aria-label", `${t("stepsLabel")}: ${stepLabel.textContent}`);
  }
  stepSwitch.addEventListener("click", () => {
    openSheet(`<h3 class="learny-steps-title">${escH(t("stepsLabel"))}</h3><div class="opts learny-steps">${stepTabs().map(tab => {
      const done = tab.querySelector(".tick") && !tab.querySelector(".tick").hidden;
      const current = tab.getAttribute("aria-selected") === "true";
      return `<button type="button" class="opt" data-view="${tab.dataset.view}"${current ? ' aria-current="step"' : ""}><span>${escH(tabName(tab))}</span>${done ? '<span class="learny-step-done" aria-hidden="true">✓</span>' : ""}</button>`;
    }).join("")}</div>`, body => body.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
      closeSheet();
      button.dataset.view === "report" ? openReport() : show(button.dataset.view);
    })));
  });
  new MutationObserver(syncLessonTop).observe($one("#tabs"), { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected", "hidden"] });
  new MutationObserver(syncLessonTop).observe($one("#tabs-row"), { attributes: true, attributeFilter: ["hidden"] });
  phone.addEventListener("change", syncLessonTop);
  document.addEventListener("lessonviewchange", syncLessonTop);
  syncLessonTop();

  /* ---------- «Сохранить кабинет»: личный код вместо регистрации ----------
     Код создается на устройстве и служит ключом к данным на сервере синхронизации.
     Адрес сервера в окне не показываем: если он был задан раньше, он сохраняется. */
  const SPACE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
  const spaceCode = () => syncCfg().code || "";
  const cleanCode = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const prettyCode = value => (cleanCode(value).match(/.{1,5}/g) || []).join("-");
  function newSpaceCode() {
    const bytes = new Uint8Array(15);
    crypto.getRandomValues(bytes);
    return prettyCode(Array.from(bytes, x => SPACE_ALPHABET[x % SPACE_ALPHABET.length]).join(""));
  }
  function spaceLink() {
    return location.href.split("#")[0] + "#space=" + spaceCode();
  }
  // Строка в кабинете говорит, где сейчас лежат данные, и предлагает одно действие.
  function syncSpaceLine() {
    const note = $one(".desk-storage-note"), button = $one(".desk-sync");
    if (!note || !button) return;
    const saved = !!spaceCode();
    note.dataset.ui = saved ? "spaceSavedLine" : "spaceLocal";
    button.dataset.ui = saved ? "spaceShow" : "spaceSave";
    note.textContent = t(note.dataset.ui);
    button.textContent = t(button.dataset.ui);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0";
      $one("#sheet-body").append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast(t("spaceCopied"));
  }
  // Сервер заводит кабинет под любой новый код, поэтому опечатка молча открыла бы пустой кабинет.
  // Перед подключением читаем кабинет без записи: true — в нем что-то есть, false — пусто, null — не удалось узнать.
  async function spaceExists(code) {
    try {
      const base = (syncCfg().url || SYNC_DEFAULT_URL).replace(/\/+$/, "");
      const res = await fetch(base + "/api/state", { headers: { Authorization: "Bearer " + code } });
      if (!res.ok) return null;
      const state = await res.json();
      const size = value => Array.isArray(value) ? value.length : Object.keys(value || {}).length;
      return ["vocab", "lessons", "progress", "overrides", "deleted"].some(key => size(state[key]) > 0);
    } catch { return null; }
  }
  async function connectSpace(code, status, button) {
    const previous = syncCfg();
    lsSet(SYNC_KEY, JSON.stringify({ url: previous.url || SYNC_DEFAULT_URL, code }));
    status(t("spaceBusy"));
    button.disabled = true;
    try {
      await runSync();
      syncSpaceLine();
      spaceSheet();
    } catch (error) {
      // не получилось: возвращаем прежнее состояние и не говорим «сохранено»
      if (previous.code) lsSet(SYNC_KEY, JSON.stringify(previous));
      else localStorage.removeItem(SYNC_KEY);
      syncSpaceLine();
      status(t(error?.code === "badcode" ? "spaceBad" : "spaceFail"));
      button.disabled = false;
    }
  }
  function spaceSheet(prefill) {
    const code = spaceCode();
    if (code && !prefill) {
      openSheet(`<h3>${t("spaceSavedTitle")}</h3>
        <p class="space-label">${t("spaceCodeLabel")}</p>
        <p class="space-code" id="space-code">${escH(code)}</p>
        <p class="space-note">${t("spaceKeep")}</p>
        <div class="space-actions">
          <button class="primary-btn" data-a="code">${t("spaceCopyCode")}</button>
          <button class="ghost-btn" data-a="link">${t("spaceCopyLink")}</button>
        </div>
        <button class="link-btn space-off" data-a="off">${t("spaceOff")}</button>`, el => {
        el.querySelector("[data-a=code]").onclick = () => copyText(code);
        el.querySelector("[data-a=link]").onclick = () => copyText(spaceLink());
        el.querySelector("[data-a=off]").onclick = () => {
          localStorage.removeItem(SYNC_KEY);
          syncSpaceLine();
          closeSheet();
          toast(t("spaceOffDone"));
        };
        el.querySelector("[data-a=code]").focus({ preventScroll: true });
      });
      return;
    }
    openSheet(`<h3>${t("spaceSave")}</h3>
      <p>${t("spaceLead")}</p>
      <button class="primary-btn space-create" data-a="create">${t("spaceCreate")}</button>
      <button class="link-btn space-have" data-a="have" aria-expanded="${prefill ? "true" : "false"}" aria-controls="space-enter">${t("spaceHave")}</button>
      <div class="space-enter" id="space-enter" ${prefill ? "" : "hidden"}>
        <div class="field">
          <label for="space-input">${t("spaceCodeLabel")}</label>
          <input id="space-input" value="${escH(prefill || "")}" placeholder="abcde-fghjk-mnpqr" autocapitalize="off" autocomplete="off" spellcheck="false">
        </div>
        <button class="ghost-btn" data-a="open">${t("spaceOpen")}</button>
      </div>
      <p class="space-status" id="space-status" aria-live="polite"></p>`, el => {
      const status = message => { el.querySelector("#space-status").textContent = message; };
      const create = el.querySelector("[data-a=create]"), have = el.querySelector("[data-a=have]");
      const enter = el.querySelector("#space-enter"), input = el.querySelector("#space-input"), open = el.querySelector("[data-a=open]");
      create.onclick = () => connectSpace(newSpaceCode(), status, create);
      have.onclick = () => {
        enter.hidden = false;
        have.setAttribute("aria-expanded", "true");
        input.focus({ preventScroll: true });
      };
      const submit = async () => {
        const typed = cleanCode(input.value);
        if (typed.length !== 15) { status(t("spaceShort")); return; }
        status(t("spaceBusy"));
        open.disabled = true;
        const found = await spaceExists(prettyCode(typed));
        open.disabled = false;
        if (found === false) { status(t("spaceEmpty")); return; }
        connectSpace(prettyCode(typed), status, open);
      };
      open.onclick = submit;
      input.addEventListener("keydown", event => { if (event.key === "Enter") submit(); });
      (prefill ? open : create).focus({ preventScroll: true });
    });
  }
  // Пункт меню «···» открывает то же окно, а не прежнее с адресом сервера.
  $one("#sync-btn").addEventListener("click", event => {
    event.stopImmediatePropagation();
    closeMenu();
    spaceSheet();
  }, true);
  // Ссылка вида …#space=код: код не уходит на сервер вместе с адресом; подключение человек подтверждает сам.
  const linkedSpace = location.hash.startsWith("#space=") ? prettyCode(decodeURIComponent(location.hash.slice(7))) : "";
  if (linkedSpace) history.replaceState(null, "", "#cabinet");

  function setupCabinet() {
    const home = $one("#view-home");
    const vocab = $one("#vocab-box");
    const sample = intake.querySelector(".learny-sample");
    const welcomeResume = document.createElement("div");
    welcomeResume.className = "desk-welcome-resume";
    const welcomeLesson = document.createElement("h2");
    const welcomeStage = document.createElement("p");
    welcomeResume.append(welcomeLesson, welcomeStage);
    sample?.insertBefore(welcomeResume, demo);
    const cabinet = document.createElement("section");
    cabinet.className = "learner-desk";
    const deskHead = document.createElement("div");
    deskHead.className = "learner-desk-head";
    const deskTitle = translated("h1", "cabinetTitle", "learner-desk-title");
    const newLink = translated("button", "learnyNew", "ghost-btn desk-create");
    newLink.type = "button";
    deskHead.append(deskTitle, newLink);
    const resume = document.createElement("article");
    resume.className = "desk-resume";
    const resumeCopy = document.createElement("div");
    const resumeStage = document.createElement("p");
    const resumeTitle = document.createElement("h2");
    resumeCopy.append(resumeStage, resumeTitle);
    const continueButton = translated("button", "cabinetContinue", "primary-btn");
    resume.append(resumeCopy, continueButton);
    cabinet.append(deskHead, resume);
    const storage = document.createElement("div");
    storage.className = "desk-storage";
    const sync = translated("button", "spaceSave", "desk-sync");
    sync.type = "button";
    sync.setAttribute("aria-haspopup", "dialog");
    sync.addEventListener("click", () => spaceSheet());
    storage.append(translated("span", "spaceLocal", "desk-storage-note"), sync);
    syncSpaceLine();

    const nav = $one(".header-actions");
    const cabinetLink = link("cabinet", "cabinet", "desk-nav");
    nav.prepend(cabinetLink);
    const catalogLink = link("catalog", "cabinetCatalog", "desk-catalog");
    $one("#learny-library-title").after(catalogLink);
    $one(".learny-back-label").dataset.ui = "cabinet";
    $one(".learny-back-label").textContent = t("cabinet");
    const narrow = matchMedia("(max-width: 800px)");
    for (const item of steps.children) {
      const details = document.createElement("details");
      details.className = "desk-guide-step";
      const summary = document.createElement("summary");
      summary.append(item.querySelector(".learny-step-art"), item.querySelector(".learny-step-title"));
      details.append(summary, item.querySelector(".learny-step-desc"));
      item.append(details);
      // Шаги урока раскрыты всегда: это рассказ о продукте, под «+» его никто не откроет.
      summary.tabIndex = -1;
      summary.addEventListener("click", event => event.preventDefault());
    }
    function setGuideLayout() {
      steps.querySelectorAll("details").forEach(details => { details.open = true; });
    }
    setGuideLayout();
    narrow.addEventListener("change", setGuideLayout);
    const dialog = document.createElement("dialog");
    dialog.id = "lesson-composer";
    dialog.setAttribute("aria-labelledby", "composer-title");
    const panel = document.createElement("section");
    panel.className = "intake learny-own";
    const title = translated("h2", "calmOwnTitle", "learny-own-title");
    title.id = "composer-title";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "composer-close";
    close.textContent = "×";
    panel.append(title, close, translated("p", "calmOwnLede", "learny-own-lede"), dropCard, translated("p", "calmOwnNote", "learny-own-note"));
    dialog.append(panel);
    document.body.append(dialog);
    home.replaceChildren(intake, inside, cabinet, library, vocab, storage);
    const homePages = ["welcome", "cabinet", "catalog"];
    let routing = false;
    let candidate = null;
    let page = "";
    let opener = null;
    let returnScroll = 0;
    const field = $one("#paste-area");
    const sheet = $one("#sheet");
    const toast = $one("#toast");
    const viewport = window.visualViewport;
    function fitComposer() {
      if (viewport?.scale === 1) {
        dialog.style.setProperty("--composer-viewport-height", viewport.height + "px");
        dialog.style.setProperty("--composer-viewport-top", viewport.offsetTop + "px");
      } else {
        dialog.style.removeProperty("--composer-viewport-height");
        dialog.style.removeProperty("--composer-viewport-top");
      }
    }
    const launchers = [actions.querySelector(".learny-own-link"), newLink];
    for (const button of launchers) {
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", dialog.id);
      button.addEventListener("click", () => {
        opener = button;
        history.pushState({ composerBase: page, composerScroll: window.scrollY }, "", "#new-lesson");
        route();
      });
    }
    function openComposer() {
      if (dialog.open) return;
      returnScroll = history.state?.composerScroll ?? window.scrollY;
      close.setAttribute("aria-label", t("wdClose"));
      panel.querySelector(".learny-own-note").textContent = t("calmOwnNote"); // после подключения своего ключа строка меняется
      // Keep key setup and its validation messages interactive inside the native modal.
      dialog.append(sheet, toast);
      dialog.showModal();
      fitComposer();
      viewport?.addEventListener("resize", fitComposer);
      viewport?.addEventListener("scroll", fitComposer);
      field.focus({ preventScroll: true });
    }
    function hideComposer(restore) {
      if (!dialog.open) return;
      if (!sheet.hidden) closeSheet();
      panel.inert = false;
      viewport?.removeEventListener("resize", fitComposer);
      viewport?.removeEventListener("scroll", fitComposer);
      dialog.close();
      document.body.append(sheet, toast);
      if (restore) {
        const trigger = opener || (page === "cabinet" ? newLink : launchers[0]);
        trigger.focus({ preventScroll: true });
        window.scrollTo({ top: returnScroll, behavior: "instant" });
      }
    }
    // Окно открыто прямо с лендинга (форма «свой урок»): закрытие возвращает к этой форме, а не в начало страницы.
    const fromLanding = (() => { try { return history.length > 1 && /landing\.html$/.test(new URL(document.referrer).pathname); } catch { return false; } })();
    function dismissComposer() {
      if (history.state?.composerBase) history.back();
      else if (page === "welcome") {
        if (fromLanding) history.back();
        else location.replace(window.learnyPaperURL?.("landing.html#own") || "landing.html#own");
      } else {
        history.replaceState(null, "", "#" + page);
        route();
      }
    }
    close.addEventListener("click", dismissComposer);
    let backdropDown = false;
    dialog.addEventListener("pointerdown", e => { backdropDown = e.target === dialog; });
    dialog.addEventListener("click", e => { if (e.target === dialog && backdropDown) dismissComposer(); });
    dialog.addEventListener("cancel", e => { e.preventDefault(); dismissComposer(); });
    dialog.addEventListener("keydown", e => {
      if (e.key === "Escape" && !sheet.hidden) {
        e.preventDefault();
        e.stopPropagation();
        closeSheet();
      }
    });
    new MutationObserver(() => {
      if (!dialog.open) return;
      panel.inert = !sheet.hidden;
      const target = sheet.hidden ? field : sheet.querySelector("input, button");
      target?.focus({ preventScroll: true });
    }).observe(sheet, { attributes: true, attributeFilter: ["hidden"] });

    function link(route, key, className) {
      const a = translated("a", key, className);
      a.href = "#" + route;
      return a;
    }
    function homePage() {
      const explicit = location.hash.slice(1);
      if (homePages.includes(explicit)) return explicit;
      if (explicit === "new-lesson" && homePages.includes(history.state?.composerBase)) return history.state.composerBase;
      return LESSONS.some(l => l.own || startedLesson(l)) || getVocab().length ? "cabinet" : "welcome";
    }
    function lastUnfinished() {
      const list = LESSONS.filter(l => startedLesson(l) && !lessonCompletion(stepProgress(l)).complete);
      return list.find(l => l.id === S.lessonId) || list.sort((a, b) => {
        const time = l => S.progress[l.id]?.lastStudiedAt || S.progress[l.id]?._updatedAt || 0;
        return time(b) - time(a);
      })[0];
    }
    function refresh() {
      if (S.view !== "home") return;
      page = homePage();
      // Первого экрана внутри приложения больше нет: его роль играет лендинг. Окно создания урока поверх него остается.
      if (page === "welcome" && (!location.hash || location.hash === "#welcome")) { location.replace(window.learnyPaperURL?.("landing.html") || "landing.html"); return; }
      document.body.dataset.calmPage = page;
      const personal = page === "cabinet";
      const welcome = page === "welcome";
      cabinet.hidden = !personal;
      storage.hidden = !personal;
      intake.hidden = !welcome;
      inside.hidden = !welcome;
      vocab.hidden = !personal;
      catalogLink.hidden = !personal;
      $one(".learny-filters").hidden = personal;
      $one("#brand-home").disabled = welcome;
      cabinetLink.setAttribute("aria-current", personal ? "page" : "false");
      const libraryTitle = $one("#learny-library-title");
      libraryTitle.dataset.ui = personal ? "lessonsLabel" : "calmSamples";
      libraryTitle.textContent = t(libraryTitle.dataset.ui);
      libraryTitle.setAttribute("aria-level", page === "catalog" ? "1" : "2");
      const demoLesson = LESSONS.find(l => l.id === DEMO_LESSON);
      const demoStarted = demoLesson && startedLesson(demoLesson);
      if (sample) {
        sample.classList.toggle("has-saved-demo", !!demoStarted);
        welcomeResume.hidden = !demoStarted;
        if (demoStarted) {
          welcomeLesson.textContent = plain(demoLesson.title);
          welcomeStage.textContent = savedPosition(demoLesson);
        }
      }
      const demoLabel = demo.querySelector("[data-ui]");
      demoLabel.dataset.ui = demoStarted ? "cabinetContinue" : "calmSampleLink";
      demoLabel.textContent = t(demoLabel.dataset.ui);
      candidate = personal ? lastUnfinished() : null;
      newLink.classList.toggle("primary-btn", !candidate);
      newLink.classList.toggle("ghost-btn", !!candidate);
      resume.hidden = !candidate;
      if (candidate) {
        resumeStage.textContent = savedPosition(candidate);
        resumeTitle.textContent = plain(candidate.title);
      }
      document.dispatchEvent(new Event("learnylibrarychange"));
      markResumed();
    }
    // Урок из карточки «Continue lesson» не повторяется первым в списке ниже; если он единственный, список его оставляет.
    function markResumed() {
      const id = !resume.hidden && document.body.dataset.calmPage === "cabinet" ? candidate?.id : "";
      const cards = [...$one("#lesson-list").children];
      const others = cards.filter(card => !card.hidden && card.dataset.lesson !== id).length;
      cards.forEach(card => card.classList.toggle("is-resumed", !!id && others > 0 && card.dataset.lesson === id));
    }
    new MutationObserver(markResumed).observe($one("#lesson-list"), { childList: true });
    continueButton.addEventListener("click", () => {
      if (candidate) openLesson(candidate.id, savedStage(candidate));
    });

    // Текст, набранный на лендинге в блоке «свой урок», переезжает в поле создания урока.
    function takeDraft() {
      let draft = "";
      try { draft = sessionStorage.getItem("learny-draft") || ""; sessionStorage.removeItem("learny-draft"); } catch {}
      const field = $one("#paste-area");
      if (!draft || !field) return;
      field.value = draft;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
    // A lesson URL contains the stage; the question index remains in the regular progress store.
    function route(focusHeading) {
      const hash = location.hash.slice(1);
      const parts = hash.split("/");
      routing = true;
      try {
        const closing = dialog.open && hash !== "new-lesson";
        if (closing) parseCtl?.abort();
        if (parts[0] === "lesson" && parts.length === 3) {
          const l = LESSONS.find(item => encodeURIComponent(item.id) === parts[1]);
          if (l && (parts[2] === "report" || lessonSteps(l).includes(parts[2]))) {
            hideComposer(false);
            if (S.lessonId !== l.id || S.view !== parts[2]) openLesson(l.id, parts[2]);
            return;
          }
        }
        if (hash && hash !== "new-lesson" && !homePages.includes(hash)) history.replaceState(null, "", "#cabinet");
        if (S.view !== "home") show("home");
        else refresh();
        if (hash === "new-lesson") { openComposer(); takeDraft(); return; }
        if (closing) { hideComposer(true); return; }
        window.scrollTo({ top: 0, behavior: "instant" });
        if (focusHeading) {
          const heading = page === "cabinet" ? deskTitle : page === "catalog" ? $one("#learny-library-title") : copy.querySelector("h1");
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      } finally { routing = false; }
    }
    document.addEventListener("lessonviewchange", ({detail}) => {
      if (detail === "home") {
        if (!routing && location.hash.startsWith("#lesson/")) history.replaceState(null, "", "#cabinet");
        refresh();
        return;
      }
      delete document.body.dataset.calmPage;
      hideComposer(false);
      cabinetLink.removeAttribute("aria-current");
      if (routing) return;
      const hash = "#lesson/" + encodeURIComponent(S.lessonId) + "/" + detail;
      if (location.hash === hash) return;
      if (location.hash.startsWith("#lesson/") || location.hash === "#new-lesson") history.replaceState(null, "", hash);
      else history.pushState(null, "", hash);
    });
    // A sync can refresh the library without changing screens.
    new MutationObserver(refresh).observe($one("#lesson-list"), {childList: true});
    window.addEventListener("hashchange", () => route(true));
    if (!location.hash && new URLSearchParams(location.search).has("demo")) openDemo();
    else route();
  }

  // Темная тема по умолчанию теплая; ?dark=graphite показывает запасной холодный вариант для сравнения.
  if (new URLSearchParams(location.search).get("dark") === "graphite") document.documentElement.dataset.dark = "graphite";

  // Логотип — только слово Learny. Для сравнения ?logo=mascot возвращает в шапку книжку.
  if (new URLSearchParams(location.search).get("logo") === "mascot") document.documentElement.dataset.logo = "mascot";

  applyLang();
  if (hero === "b") setupCabinet();
  else if (new URLSearchParams(location.search).has("demo")) openDemo();
  if (linkedSpace && linkedSpace !== spaceCode()) spaceSheet(linkedSpace);
  document.addEventListener("lessonviewchange", ({detail}) => { if (detail === "home") syncSpaceLine(); });
  syncAction();
})();
