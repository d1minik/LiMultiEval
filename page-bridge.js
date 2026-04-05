(function () {
  if (window.__lmePageBridgeInstalled) return;
  window.__lmePageBridgeInstalled = true;
  document.documentElement.dataset.lmeBridgeReady = "1";

  let queuedPreloadDetail = null;
  let queuedPreloadId = 0;
  let preloadWorkerRunning = false;

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function getStudy() {
    return window.site?.analysis?.study || window.lichess?.analysis?.study || null;
  }

  function getCurrentChapterId() {
    const study = getStudy();
    const chapterId = study?.data?.chapter?.id;
    return typeof chapterId === "string" ? chapterId : "";
  }

  function shouldAbortPreload(requestId) {
    return requestId !== queuedPreloadId && queuedPreloadDetail !== null;
  }

  async function preloadVisibleChapters(detail, requestId) {
    const chapterIds = Array.from(
      new Set(
        (Array.isArray(detail?.chapterIds) ? detail.chapterIds : [])
          .map((chapterId) => String(chapterId || "").trim())
          .filter(Boolean)
      )
    );
    if (chapterIds.length < 2) return;

    const delayMs = Math.max(80, Math.min(1000, Number(detail?.delayMs) || 220));
    const requestedActiveChapterId = String(detail?.activeChapterId || "").trim();

    let attempts = 0;
    while (attempts < 20) {
      if (shouldAbortPreload(requestId)) return;
      const study = getStudy();
      if (study && typeof study.setChapter === "function") break;
      attempts += 1;
      await sleep(150);
    }

    const study = getStudy();
    if (!study || typeof study.setChapter !== "function") return;

    const originalChapterId = requestedActiveChapterId || getCurrentChapterId() || chapterIds[0];
    const chaptersToWarm = chapterIds.filter((chapterId) => chapterId !== originalChapterId);
    let currentChapterId = originalChapterId;

    try {
      for (const chapterId of chaptersToWarm) {
        if (shouldAbortPreload(requestId)) break;
        if (chapterId === currentChapterId) continue;

        study.setChapter(chapterId);
        currentChapterId = chapterId;
        await sleep(delayMs);
      }
    } finally {
      if (originalChapterId && currentChapterId !== originalChapterId) {
        study.setChapter(originalChapterId);
      }
    }
  }

  async function runPreloadQueue() {
    if (preloadWorkerRunning) return;
    preloadWorkerRunning = true;

    try {
      while (queuedPreloadDetail) {
        const detail = queuedPreloadDetail;
        const requestId = queuedPreloadId;
        queuedPreloadDetail = null;
        await preloadVisibleChapters(detail, requestId);
      }
    } finally {
      preloadWorkerRunning = false;
      if (queuedPreloadDetail) {
        runPreloadQueue();
      }
    }
  }

  window.addEventListener("lme-preload-visible-chapters", (event) => {
    queuedPreloadDetail = event.detail || {};
    queuedPreloadId += 1;
    runPreloadQueue();
  });
})();
