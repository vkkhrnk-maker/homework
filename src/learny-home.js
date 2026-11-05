(() => {
  const mascotAssets = {}; // MASCOTS_INLINE
  let mascotCount = 0;

  Object.assign(UI, {
    brandName: { ru: "Learny", en: "Learny" },
    menuTitle: { ru: "Learny", en: "Learny" },
    homeTitle: { ru: "Превратите английский текст в практику по шагам", en: "Turn any English text into guided practice" },
    homeLede: {
      ru: "Вставьте материал от учителя или напишите тему. Получите урок с объяснениями, упражнениями и разговорной практикой и разберите свои ответы.",
      en: "Paste your teacher’s notes or enter a topic. Create a lesson with explanations, exercises and speaking practice, then review your answers."
    },
    intakeBtn: { ru: "Создать урок", en: "Create my lesson" },
    learnyHome: { ru: "Главная", en: "Home" },
    learnyNew: { ru: "Новый урок", en: "New lesson" },
    lessonsLabel: { ru: "Мои уроки", en: "Your lessons" },
    learnyAll: { ru: "Все", en: "All" },
    learnyGrammar: { ru: "Грамматика", en: "Grammar" },
    learnySpeaking: { ru: "Говорение", en: "Speaking" },
    learnyNoLessons: { ru: "В этой категории пока нет уроков", en: "No lessons in this category yet" },
    learnyFooter: { ru: "Практика, урок за уроком", en: "Practice, one lesson at a time." },
    how2p: { ru: "Разбирайте правила, переводите фразы и сохраняйте новые слова.", en: "Explore explanations, translate phrases and save new words." },
    how3p: { ru: "Решайте задания, проверяйте ответы и разбирайте ошибки.", en: "Try exercises, check your answers and learn from feedback." },
    how4t: { ru: "Выбирайте по смыслу", en: "Choose in context" },
    how4p: { ru: "Читайте мини-истории и выбирайте форму, которая подходит по смыслу.", en: "Read short stories and choose the form that fits the meaning." },
    how5p: { ru: "Запишите ответ и получите подсказки, как сказать яснее.", en: "Record an answer and review suggestions for clearer English." },
    how6t: { ru: "Повторяйте и запоминайте", en: "Review & remember" },
    how6p: { ru: "Повторите урок, вернитесь к сохранённым словам и поделитесь отчётом.", en: "Review your lesson, revisit saved words and share your report." }
  });

  function image(name, className) {
    const img = document.createElement("img");
    img.src = `icons/learny-home/${name}.svg`;
    img.alt = "";
    img.className = className;
    return img;
  }
  function mascot(name, className) {
    // Repeated cards need independent IDs for their masks and clipping paths.
    const instance = `learny-mascot-${++mascotCount}-`;
    const template = document.createElement("template");
    template.innerHTML = mascotAssets[name].replace(/\b(id="|url\(#|href="#)([^")]+)/g, `$1${instance}$2`);
    const svg = template.content.firstElementChild;
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.removeProperty("display");
    svg.style.setProperty("--blink-delay", `${-(mascotCount % 9) * .62}s`);
    for (const eye of svg.querySelectorAll('g[id$="-Eye"], g[id$="-Eye_2"]')) eye.classList.add("mascot-eyes");
    return svg;
  }
  function translated(tag, key, className) {
    const el = document.createElement(tag);
    el.dataset.ui = key;
    el.className = className;
    return el;
  }

  $("#brand-home i").append(mascot("brand-book", "learny-brand-mascot"));
  $("#menu-btn").append(image("menu", "learny-menu-icon"));
  const field = $("#paste-area");
  const composer = $("#material-composer");
  const nav = $(".top-nav");
  const left = document.createElement("div");
  left.className = "learny-nav-side";
  const right = left.cloneNode();
  const home = translated("button", "learnyHome", "learny-home-link");
  const create = translated("button", "learnyNew", "learny-home-link");
  left.append(home, $('[data-nav="lesson-list"]'));
  right.append($('[data-nav="vocab-box"]'), create);
  nav.append(left, right);
  home.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "instant" }));
  create.addEventListener("click", () => {
    composer.scrollIntoView({ block: "center" });
    field.focus({ preventScroll: true });
  });

  const frame = document.createElement("div");
  frame.className = "learny-editor-frame";
  composer.before(frame);
  frame.append(composer);
  for (const corner of ["tl", "tr", "bl", "br"]) {
    const marker = document.createElement("span");
    marker.className = `learny-handle corner-${corner}`;
    marker.setAttribute("aria-hidden", "true");
    frame.append(marker);
  }
  $("#material-attach svg").replaceWith(image("attach", "learny-attach-icon"));
  $(".material-tools").append($("#parse-btn"));

  const example = document.createElement("div");
  example.className = "learny-input-example";
  example.setAttribute("aria-hidden", "true");
  const instruction = document.createElement("p");
  const prompt = document.createElement("p");
  example.append(instruction, prompt);
  field.after(example);
  const samples = {
    en: ["For example, “When do I use the present perfect?”", "“Practise ordering coffee in English.”", "“Help me tell a story using past tenses.”"],
    ru: ["Например, «Когда употреблять present perfect?»", "«Помогите научиться заказывать кофе по-английски»", "«Как рассказать историю в прошедшем времени?»"]
  };
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let exampleTimer, inView = false;
  function resetExample() {
    clearTimeout(exampleTimer);
    const options = samples[document.documentElement.lang] || samples.en;
    instruction.textContent = t("intakePlaceholder").split("\n")[0];
    prompt.textContent = options[0];
    if (!inView || document.hidden || reducedMotion.matches || field.value || field.matches(":focus")) return;

    let index = 0;
    function nextExample() {
      index = (index + 1) % options.length;
      const text = options[index];
      let length = 0;
      function typeLetter() {
        prompt.textContent = text.slice(0, ++length);
        exampleTimer = length < text.length
          ? setTimeout(typeLetter, 35)
          : setTimeout(nextExample, 3800);
      }
      typeLetter();
    }
    exampleTimer = setTimeout(nextExample, 3800);
  }
  for (const event of ["focus", "blur", "input"]) field.addEventListener(event, resetExample);
  document.addEventListener("visibilitychange", resetExample);
  reducedMotion.addEventListener("change", resetExample);
  function updateLanguage() {
    document.title = document.documentElement.lang === "ru" ? "Learny — практика английского" : "Learny — English practice";
    resetExample();
  }
  new MutationObserver(updateLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resetExample();
  }).observe(composer);

  const steps = { 2: "step-book", 3: "step-pencil", 4: "step-bubble", 5: "step-microphone", 6: "step-star" };
  const how = $("#how-list");
  function decorateSteps() {
    for (const icon of how.querySelectorAll("svg.ico:not(.learny-step-art)")) {
      icon.replaceWith(mascot(steps[icon.closest(".how-item").dataset.c], "ico learny-step-art"));
    }
  }
  new MutationObserver(decorateSteps).observe(how, { childList: true, subtree: true });

  const lessons = $("#lesson-list");
  const library = document.createElement("section");
  library.id = "learny-library";
  const title = translated("h2", "lessonsLabel", "learny-library-title");
  title.id = "learny-library-title";
  library.setAttribute("aria-labelledby", title.id);
  const filters = document.createElement("div");
  filters.className = "learny-filters";
  const empty = translated("p", "learnyNoLessons", "learny-empty");
  lessons.before(library);
  library.append(title, filters, lessons, empty);
  $('[data-nav="lesson-list"]').dataset.nav = library.id;
  let filter = "all";
  const categories = { all: "learnyAll", grammar: "learnyGrammar", speaking: "learnySpeaking" };
  for (const [name, key] of Object.entries(categories)) {
    const button = translated("button", key, "learny-filter");
    button.dataset.filter = name;
    button.addEventListener("click", () => {
      filter = name;
      filterLessons();
    });
    filters.append(button);
  }
  function filterLessons() {
    let visible = 0;
    for (const card of lessons.children) {
      const data = LESSONS.find(item => item.id === card.dataset.lesson);
      const category = data?.speak && !data.drill ? "speaking" : "grammar";
      card.hidden = filter !== "all" && filter !== category;
      if (!card.hidden) visible++;
    }
    for (const button of filters.children) button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    empty.hidden = visible > 0;
  }
  const lessonArt = {
    "past-stories": "lesson-past", modals: "lesson-modals", future: "lesson-future",
    "culture-b1": "lesson-b1", "culture-c1": "lesson-c1"
  };
  function decorateLessons() {
    for (const card of lessons.children) {
      const art = card.querySelector(".lc-art");
      if (art && lessonArt[card.dataset.lesson]) art.replaceWith(mascot(lessonArt[card.dataset.lesson], "lc-art"));
      const arrow = card.querySelector(".lc-resume-arrow");
      arrow.prepend(image("lesson-arrow", "learny-arrow-oval"));
    }
    filterLessons();
  }
  new MutationObserver(decorateLessons).observe(lessons, { childList: true });

  const footer = $(".app-footer");
  const footerRight = document.createElement("div");
  footerRight.className = "learny-footer-right";
  footerRight.append(translated("span", "learnyFooter", "learny-footer-note"), $(".footer-year"));
  footer.append(mascot("footer-cup", "learny-footer-cup"), footerRight);
  const cursor = mascot("cursor", "playful-pointer-art");
  enableLearnyPointer(cursor);

  applyLang();
  updateLanguage();
})();
