(() => {
  const mascotAssets = {}; // MASCOTS_INLINE
  let mascotCount = 0;

  Object.assign(UI, {
    brandName: { ru: "Learny", en: "Learny" },
    menuTitle: { ru: "Learny", en: "Learny" },
    homeTitle: { ru: "Из текста — в практику", en: "Turn your text into practice" },
    learnyTitleStart: { ru: "Из текста —", en: "Turn your text" },
    learnyTitleEnd: { ru: "в практику", en: "into practice" },
    learnyMaterial: { ru: "Текст или тема урока", en: "Lesson notes or topic" },
    homeLede: {
      ru: "Превратите заметки учителя или любую тему в урок с упражнениями и разговорной практикой.",
      en: "Turn your teacher’s notes or a topic of your choice into exercises and speaking practice."
    },
    intakeBtn: { ru: "Создать урок", en: "Create my lesson" },
    learnyGuide: { ru: "Как устроен урок", en: "Inside a lesson" },
    learnyNew: { ru: "Новый урок", en: "New lesson" },
    lessonsLabel: { ru: "Мои уроки", en: "Your lessons" },
    learnyAll: { ru: "Все", en: "All" },
    learnyGrammar: { ru: "Грамматика", en: "Grammar" },
    learnySpeaking: { ru: "Говорение", en: "Speaking" },
    learnyNoLessons: { ru: "В этой категории пока нет уроков", en: "No lessons in this category yet" },
    intakeReady: { ru: "Нажмите «Создать урок», когда будете готовы.", en: "Choose Create my lesson when you’re ready." },
    intakePlaceholder: { ru: "Например, «Когда употреблять present perfect?»", en: "For example, “When do I use the present perfect?”" },
    how2p: { ru: "Разбирайте правила, переводите фразы и сохраняйте новые слова.", en: "Explore explanations, translate phrases and save new words." },
    how3p: { ru: "Решайте задания, проверяйте ответы и разбирайте ошибки.", en: "Try exercises, check your answers and learn from feedback." },
    how4t: { ru: "Выбирайте по смыслу", en: "Choose in context" },
    how4p: { ru: "Читайте мини-истории и выбирайте форму, которая подходит по смыслу.", en: "Read short stories and choose the form that fits the meaning." },
    how5p: { ru: "Запишите ответ и получите подсказки, как сказать яснее.", en: "Record an answer and review suggestions for clearer English." },
    how6t: { ru: "Повторяйте и запоминайте", en: "Review & remember" },
    how6p: { ru: "Повторите урок, вернитесь к сохранённым словам и поделитесь отчётом.", en: "Review your lesson, revisit saved words and share your report." }
  });

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
    return svg;
  }
  function translated(tag, key, className) {
    const el = document.createElement(tag);
    el.dataset.ui = key;
    el.className = className;
    return el;
  }

  $("#brand-home i").append(mascot("brand-book", "learny-brand-mascot"));
  const field = $("#paste-area");
  const composer = $("#material-composer");
  const create = translated("button", "learnyNew", "learny-new-lesson");
  $(".top-nav").append(create);
  create.addEventListener("click", () => {
    if (S.view !== "home") show("home");
    composer.scrollIntoView({ block: "center" });
    field.focus({ preventScroll: true });
  });

  const frame = document.createElement("div");
  frame.className = "learny-editor-frame";
  composer.before(frame);
  frame.append(composer);
  const materialLabel = translated("label", "learnyMaterial", "learny-material-label");
  materialLabel.htmlFor = field.id;
  composer.prepend(materialLabel);
  frame.append(mascot("step-pencil", "learny-editor-pencil"));
  const heroTitle = $('.intake-copy h1');
  heroTitle.removeAttribute("data-ui");
  heroTitle.replaceChildren(translated("span", "learnyTitleStart", "learny-title-start"),
    document.createTextNode(" "), translated("span", "learnyTitleEnd", "learny-title-end"));
  $(".material-tools").append($("#parse-btn"));
  materialLabel.id = "learny-material-label";
  field.setAttribute("aria-labelledby", materialLabel.id);

  const guide = document.createElement("details");
  guide.className = "learny-guide";
  guide.append(translated("summary", "learnyGuide", "learny-guide-title"));
  const steps = document.createElement("ul");
  steps.className = "learny-guide-steps";
  const stepArt = ["step-book", "step-pencil", "step-bubble", "step-microphone", "step-star"];
  stepArt.forEach((asset, index) => {
    const item = document.createElement("li");
    const key = "how" + (index + 2);
    item.append(mascot(asset, "learny-step-art"), translated("strong", key + "t", "learny-step-title"),
      translated("p", key + "p", "learny-step-desc"));
    steps.append(item);
  });
  guide.append(steps);
  $("#how-list").remove();

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
  library.after(guide);
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
    const personal = document.body.dataset.calmPage === "cabinet";
    const catalog = ["welcome", "catalog"].includes(document.body.dataset.calmPage);
    let visible = 0;
    for (const card of lessons.children) {
      const data = LESSONS.find(item => item.id === card.dataset.lesson);
      const category = data?.speak && !data.drill ? "speaking" : "grammar";
      card.hidden = personal ? !data || !(data.own || startedLesson(data))
        : (catalog && data?.own) || (filter !== "all" && filter !== category);
      if (!card.hidden) visible++;
    }
    for (const button of filters.children) button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    empty.hidden = visible > 0;
    empty.textContent = t(personal ? "cabinetEmpty" : "learnyNoLessons");
  }
  document.addEventListener("learnylibrarychange", filterLessons);
  const lessonArt = {
    "past-stories": "lesson-past", modals: "lesson-modals", future: "lesson-future",
    "culture-b1": "lesson-b1", "culture-c1": "lesson-c1"
  };
  const contextBar = document.createElement("div");
  contextBar.className = "learny-lesson-context";
  const back = document.createElement("button");
  back.className = "learny-back";
  back.innerHTML = '<span aria-hidden="true">←</span>';
  back.append(translated("span", "navHome", "learny-back-label"));
  back.addEventListener("click", () => {
    if (document.documentElement.dataset.hero === "b") location.hash = "cabinet";
    else $('[data-nav="learny-library"]').click();
  });
  const progress = $("#progress-wrap");
  progress.prepend(translated("span", "cardProgress", "learny-progress-caption"));
  contextBar.append(back, progress);
  $("#tabs").before(contextBar);

  const stages = ["theory", "drill", "match", "speak"];
  for (const stage of stages) {
    const section = $("#view-" + stage);
    section.classList.add("learny-stage");
    const rail = document.createElement("div");
    rail.className = "learny-rail";
    const companion = document.createElement("div");
    companion.className = "learny-companion";
    if (stage === "theory") rail.append(companion);
    rail.append(section.querySelector(stage === "theory" ? ".toc" : ".q-strip"));
    const work = document.createElement("div");
    work.className = "learny-work";
    const layout = section.querySelector(".theory-layout, .drill-layout");
    if (stage === "theory") work.append(...layout.children);
    else {
      work.append($("#" + stage + "-card"));
      if (layout) work.append(layout.querySelector(".aside"));
    }
    layout?.remove();
    section.append(rail, work);
  }
  function updateStage(stage) {
    if (!stages.includes(stage)) return;
    const l = lesson();
    if (stage === "theory") {
      $("#view-theory .learny-companion").replaceChildren(mascot(lessonArt[l.id] || "brand-book", "learny-stage-mascot"));
    }
    $("#view-" + stage + " .section-heading .eyebrow").textContent = l.title;
    const current = $('#tabs [aria-selected="true"]');
    if (current && $("#tabs").scrollWidth > $("#tabs").clientWidth)
      $("#tabs").scrollLeft = current.offsetLeft - $("#tabs").offsetLeft;
  }
  document.addEventListener("lessonviewchange", event => updateStage(event.detail));
  new MutationObserver(filterLessons).observe(lessons, { childList: true });
  applyLang();
})();
