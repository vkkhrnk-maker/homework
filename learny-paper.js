// Вариант сравнения живёт в адресе вкладки и следует за переходом между страницами.
(() => {
  const paper = new URLSearchParams(location.search).get("paper");
  if (paper === "warm" || paper === "white") document.documentElement.dataset.paper = paper;
  window.learnyPaperURL = path => {
    if (!document.documentElement.dataset.paper) return path;
    const url = new URL(path, location.href);
    url.searchParams.set("paper", paper);
    return url.href;
  };
})();
