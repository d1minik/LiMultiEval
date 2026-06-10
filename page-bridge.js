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

  function parseFen(fen) {
    if (!fen || typeof fen !== "string") return null;
    const parts = fen.split(" ");
    if (parts.length < 6) return null;
    const activeColor = parts[1];
    const fullmove = parseInt(parts[5], 10);
    if (isNaN(fullmove)) return null;
    return { activeColor, fullmove };
  }

  function getMiniGameChapterId(game) {
    if (!game) return "";
    const chapterClass = Array.from(game.classList).find((className) => className.startsWith("chap-"));
    return chapterClass ? chapterClass.slice(5) : "";
  }

  function updateMoveNumbers() {
    try {
      const study = getStudy();
      if (!study || !study.chapters || typeof study.chapters.list?.all !== "function") return;

      const chapters = study.chapters.list.all();
      const chapterMap = new Map();
      for (const chap of chapters) {
        if (chap && chap.id && chap.fen) {
          chapterMap.set(chap.id, chap.fen);
        }
      }

      const miniGames = document.querySelectorAll(".study__multiboard .mini-game");
      miniGames.forEach((game) => {
        const chapterId = getMiniGameChapterId(game);
        if (!chapterId) return;

        const fen = chapterMap.get(chapterId);
        if (!fen) return;

        const info = parseFen(fen);
        if (!info) return;

        let moveNum = info.fullmove;
        let moveColor = "w";
        if (info.activeColor === "w") {
          moveNum = info.fullmove - 1;
          moveColor = "b";
        }

        const moveNumStr = String(moveNum);
        if (game.dataset.lmeMoveNumber !== moveNumStr) {
          game.dataset.lmeMoveNumber = moveNumStr;
        }
        if (game.dataset.lmeMoveColor !== moveColor) {
          game.dataset.lmeMoveColor = moveColor;
        }
      });
    } catch (e) {
      console.warn("LiMultiEval: Error updating move numbers", e);
    }
  }

  let updateRaf = 0;
  function scheduleUpdate() {
    if (updateRaf) return;
    updateRaf = requestAnimationFrame(() => {
      updateRaf = 0;
      updateMoveNumbers();
    });
  }

  // Set up mutation observer to update move numbers on DOM changes
  const observer = new MutationObserver(() => {
    scheduleUpdate();
  });

  try {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        try {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"]
          });
        } catch (e) {
          console.warn("LiMultiEval: Observer DOMContentLoaded registration failed", e);
        }
      });
    }
  } catch (e) {
    console.warn("LiMultiEval: Observer initial registration failed", e);
  }

  // Also set up a periodic interval as a fallback backup for real-time safety
  window.setInterval(scheduleUpdate, 250);
})();
