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
    calmOwnLink: { ru: "Собрать из своего текста", en: "Use my own text" },
    calmOwnTitle: { ru: "Урок из текста", en: "A lesson from your text" },
    calmOwnLede: {
      ru: "Вставьте домашку от учителя или назовите тему. Нужен ключ ИИ, бесплатный подойдет.",
      en: "Paste your teacher’s homework or name a topic. It needs an AI key; a free one works."
    },
    calmSampleLabel: { ru: "Вопрос из готового урока", en: "A question from a sample lesson" },
    cabinet: { ru: "Кабинет", en: "My space" },
    cabinetTitle: { ru: "Мой кабинет", en: "My learning space" },
    cabinetContinue: { ru: "Продолжить урок", en: "Continue lesson" },
    cabinetCatalog: { ru: "Каталог уроков", en: "Lesson catalog" },
    cabinetEmpty: { ru: "Здесь появятся уроки, которые вы открыли или создали.", en: "Lessons you open or create will appear here." },
    cabinetStageEnd: { ru: "Итоги этапа", en: "Stage results" },
    calmReview: { ru: "Повторение", en: "Review" },
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
  demo.className = "learny-demo" + (hero === "b" ? " is-primary" : "");
  const arrow = document.createElement("span");
  arrow.className = "learny-demo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  demo.append(translated("span", "calmDemo", ""), arrow);
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
      sample.append(translated("span", "calmSampleLabel", "learny-sample-label"), sentence, chips, translated("p", "calmSampleNote", "learny-sample-note"));
      intake.append(sample);
      // карандаш — персонаж шага «Practise», поэтому он сидит на карточке с вопросом
      const pencil = $one(".learny-editor-pencil");
      if (pencil) sample.append(pencil);
    }
    const ownLink = translated("button", "calmOwnLink", "learny-own-link");
    ownLink.type = "button";
    actions.append(ownLink);
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
  // шаги на главной называются так же, как вкладки урока: Theory, Practice, Mini-dialogues, Speaking
  ["navTheory", "navDrill", "navMatch", "navSpeak", "calmReview"].forEach((key, index) => {
    const title = steps.querySelectorAll(".learny-step-title")[index];
    if (title && UI[key]) title.dataset.ui = key;
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
  const pinned = ":is(#view-drill, #view-match):not([hidden]) :is(#drill-card .answer-row .primary-btn, #drill-card .nav-row .primary-btn, #match-card .nav-row .primary-btn)";
  const syncAction = () => document.body.classList.toggle("has-action", !!$one(pinned));
  for (const id of ["#drill-card", "#match-card"]) new MutationObserver(syncAction).observe($one(id), { childList: true, subtree: true });
  document.addEventListener("lessonviewchange", syncAction);

  function setupCabinet() {
    const home = $one("#view-home");
    const vocab = $one("#vocab-box");
    const sample = intake.querySelector(".learny-sample");
    const welcomeResume = document.createElement("div");
    welcomeResume.className = "desk-welcome-resume";
    const welcomeLesson = document.createElement("h2");
    const welcomeStage = document.createElement("p");
    welcomeResume.append(welcomeLesson, welcomeStage);
    sample?.append(welcomeResume);
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
    }
    function setGuideLayout() {
      steps.querySelectorAll("details").forEach(details => { details.open = !narrow.matches; });
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
    panel.append(title, close, translated("p", "calmOwnLede", "learny-own-lede"), dropCard);
    dialog.append(panel);
    document.body.append(dialog);
    home.replaceChildren(intake, inside, cabinet, library, vocab);
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
    function dismissComposer() {
      if (history.state?.composerBase) history.back();
      else {
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
      document.body.dataset.calmPage = page;
      const personal = page === "cabinet";
      const welcome = page === "welcome";
      cabinet.hidden = !personal;
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
      demoLabel.dataset.ui = demoStarted ? "cabinetContinue" : "calmDemo";
      demoLabel.textContent = t(demoLabel.dataset.ui);
      candidate = personal ? lastUnfinished() : null;
      resume.hidden = !candidate;
      if (candidate) {
        resumeStage.textContent = savedPosition(candidate);
        resumeTitle.textContent = plain(candidate.title);
      }
      document.dispatchEvent(new Event("learnylibrarychange"));
    }
    continueButton.addEventListener("click", () => {
      if (candidate) openLesson(candidate.id, savedStage(candidate));
    });

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
        if (hash === "new-lesson") { openComposer(); return; }
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

  // Шрифт заголовков на пробу: ?type=geologica | rubik | nunito
  const TYPE = { geologica: "Geologica:wght@800", rubik: "Rubik:wght@800", nunito: "Nunito:wght@900" };
  const type = new URLSearchParams(location.search).get("type");
  if (TYPE[type]) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${TYPE[type]}&display=swap`;
    document.head.append(link);
    document.documentElement.dataset.type = type;
  }

  applyLang();
  if (hero === "b") setupCabinet();
  else if (new URLSearchParams(location.search).has("demo")) openDemo();
  syncAction();
})();
