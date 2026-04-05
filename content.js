const DEFAULT_SETTINGS = {
  enabled: true,
  onlyPlaying: true,
  showEvalText: true,
  hideFlags: true,
  hideTitle: true,
  titleBoldness: "bold",
  titleColor: "#e69900",
  titleOpacity: "100",
  cardsPerRow: "4",
  cardWidthScale: "100",
  cardHeight: "74",
  viewportPadding: "14",
  gridGap: "22",
  cardPaddingX: "16",
  cardPaddingY: "8",
  playerRowGap: "9",
  inlineGap: "6",
  nameScale: "127",
  evalTextScale: "90",
  clockScale: "120",
  lastMoveScale: "105",
  evalBarWidth: "22",
  evalBarBorderWidth: "0",
  evalBarBorderColor: "#ffffff",
  evalBarBorderOpacity: "18",
  evalTextGap: "0",
  cardRadius: "10",
  cardBorderWidth: "0",
  cardBorderColor: "#000000",
  cardBorderOpacity: "100",
  pageBgColor: "#161512",
  cardBgColor: "#474747",
  cardBgOpacity: "100",
  flagOpacity: "100",
  whiteNameColor: "#000000",
  whiteNameOpacity: "100",
  whiteNameBoldness: "bold",
  whiteBoxColor: "#ffffff",
  whiteBoxOpacity: "100",
  blackNameColor: "#ffffff",
  blackNameOpacity: "100",
  blackNameBoldness: "bold",
  blackBoxColor: "#000000",
  blackBoxOpacity: "100",
  whiteClockColor: "#ffffff",
  whiteClockOpacity: "100",
  whiteClockBgColor: "#333333",
  whiteClockBgOpacity: "100",
  whiteClockBoldness: "bold",
  blackClockColor: "#ffffff",
  blackClockOpacity: "100",
  blackClockBgColor: "#333333",
  blackClockBgOpacity: "100",
  blackClockBoldness: "bold",
  lastMoveColor: "#d1d1d1",
  lastMoveOpacity: "100",
  lastMoveBgColor: "#424242",
  lastMoveBgOpacity: "100",
  evalTextColor: "#ffffff",
  evalTextOpacity: "100",
  evalTextBgColor: "#2a2a2a",
  evalTextBgOpacity: "100",
  winBgColor: "#5F8B2C",
  winBgOpacity: "100",
  winTextColor: "#ffffff",
  winTextOpacity: "100",
  lossBgColor: "#BD392D",
  lossBgOpacity: "100",
  lossTextColor: "#ffffff",
  lossTextOpacity: "100",
  drawBgColor: "#8a8a8a",
  drawBgOpacity: "100",
  drawTextColor: "#ffffff",
  drawTextOpacity: "100",
  globalFont: "",
  customFonts: [],
  nameOverrides: []
};

const FONT_PRESETS = [
  { label: "Noto Sans", css: "'Noto Sans', sans-serif" },
  { label: "Roboto", css: "Roboto, sans-serif" },
  { label: "System UI", css: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: "Arial", css: "Arial, sans-serif" },
  { label: "Verdana", css: "Verdana, sans-serif" },
  { label: "Trebuchet MS", css: "'Trebuchet MS', sans-serif" },
  { label: "Tahoma", css: "Tahoma, sans-serif" },
  { label: "Times New Roman", css: "'Times New Roman', serif" },
  { label: "Georgia", css: "Georgia, serif" },
  { label: "Courier New", css: "'Courier New', monospace" }
];

const FONT_PRESET_BY_LABEL = new Map(
  FONT_PRESETS.map((preset) => [normalizeFontLabel(preset.label), preset])
);
const FONT_PRESET_BY_STACK = new Map(
  FONT_PRESETS.map((preset) => [normalizeFontStack(preset.css), preset])
);

let latestSettings = mergeStoredSettings(DEFAULT_SETTINGS);
let syncRaf = 0;
let multiboardObserver = null;
let resizeBound = false;
let preloadTimer = 0;
let preloadDispatchNonce = 0;
let activeMultiboard = null;
const preloadedBoardSetSignatures = new Set();

function restoreMiniGameLinks() {
  document.querySelectorAll(".study__multiboard .mini-game").forEach((game) => {
    if (game.dataset.lmeHref && !game.getAttribute("href")) {
      game.setAttribute("href", game.dataset.lmeHref);
    }
    game.removeAttribute("tabindex");
    game.removeAttribute("aria-disabled");
    game.removeAttribute("draggable");
  });
}

function stripMatchingQuotes(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if ((firstChar === '"' || firstChar === "'") && firstChar === lastChar) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseFontFamilies(value) {
  const input = String(value || "");
  const families = [];
  let current = "";
  let quote = "";

  for (const char of input) {
    if (char === '"' || char === "'") {
      if (quote === char) quote = "";
      else if (!quote) quote = char;
      current += char;
      continue;
    }
    if (char === "," && !quote) {
      const family = stripMatchingQuotes(current);
      if (family) families.push(family);
      current = "";
      continue;
    }
    current += char;
  }
  const trailingFamily = stripMatchingQuotes(current);
  if (trailingFamily) families.push(trailingFamily);
  return families;
}

function normalizeFontLabel(value) {
  return stripMatchingQuotes(value).replace(/\s+/g, " ").toLowerCase();
}

function normalizeFontStack(value) {
  return parseFontFamilies(value)
    .map((family) => family.replace(/\s+/g, " ").toLowerCase())
    .join(",");
}

function resolveFontCssValue(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  const preset =
    FONT_PRESET_BY_LABEL.get(normalizeFontLabel(rawValue)) ||
    FONT_PRESET_BY_STACK.get(normalizeFontStack(rawValue));
  return preset ? preset.css : rawValue;
}

function sanitizeCustomFonts(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const fonts = [];

  value.forEach((entry) => {
    const font = String(entry || "").trim();
    if (!font) return;
    const key = normalizeFontStack(font) || normalizeFontLabel(font);
    if (!key || seen.has(key)) return;
    seen.add(key);
    fonts.push(font);
  });

  return fonts;
}

function sanitizeNameOverrideDrafts(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const source = String(entry.source ?? entry.from ?? entry.name ?? "").trim();
      const target = String(entry.target ?? entry.to ?? entry.text ?? entry.replacement ?? "").trim();
      if (!source && !target) return null;
      return { source, target };
    })
    .filter(Boolean);
}

function mergeStoredSettings(raw) {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  merged.customFonts = sanitizeCustomFonts(raw?.customFonts);
  merged.nameOverrides = sanitizeNameOverrideDrafts(raw?.nameOverrides);
  merged.showEvalText =
    typeof raw?.showEvalText === "boolean"
      ? raw.showEvalText
      : typeof raw?.showEvalBar === "boolean"
        ? raw.showEvalBar
        : DEFAULT_SETTINGS.showEvalText;
  return merged;
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseOpacity(value, fallbackPercent) {
  return clamp(parseNumber(value, fallbackPercent), 0, 100) / 100;
}

function parseHexColor(value) {
  if (typeof value !== "string") return null;
  let hex = value.trim();
  if (!hex.startsWith("#")) return null;
  hex = hex.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((char) => char + char).join("");
  }
  if (hex.length !== 6 && hex.length !== 8) return null;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
}

function colorWithOpacity(color, opacityValue, fallbackColor, fallbackOpacityValue = 100) {
  const parsedColor = parseHexColor(color) || parseHexColor(fallbackColor);
  if (!parsedColor) return fallbackColor;
  const alpha = parseOpacity(opacityValue, fallbackOpacityValue);
  return `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, ${alpha})`;
}

function normalizeNameOverrideKey(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function buildNameOverrideMap(settings) {
  const map = new Map();

  sanitizeNameOverrideDrafts(settings?.nameOverrides).forEach((entry) => {
    if (!entry.source || !entry.target) return;
    map.set(normalizeNameOverrideKey(entry.source), entry.target);
  });

  return map;
}

function extractOriginalPlayerName(nameEl) {
  if (!nameEl) return "";
  if (nameEl.dataset.lmeOriginalName) {
    return nameEl.dataset.lmeOriginalName;
  }

  const rawName = Array.from(nameEl.childNodes)
    .filter((node) => {
      return !(
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList &&
        node.classList.contains("utitle")
      );
    })
    .map((node) => node.textContent || "")
    .join(" ");

  const normalizedName = String(rawName).replace(/\s+/g, " ").trim();
  if (normalizedName) {
    nameEl.dataset.lmeOriginalName = normalizedName;
  }
  return normalizedName;
}

function getDefaultDisplayName(fullName) {
  const normalizedName = String(fullName || "").replace(/\s+/g, " ").trim();
  if (!normalizedName) return "";
  if (!normalizedName.includes(",")) return normalizedName;
  return normalizedName.split(",")[0].trim();
}

function applyDisplayName(nameEl, displayName, hideTitle) {
  if (!nameEl) return;

  const titleSpan = nameEl.querySelector(".utitle");
  if (titleSpan) {
    const nextDisplay = hideTitle ? "none" : "";
    if (titleSpan.style.display !== nextDisplay) {
      titleSpan.style.display = nextDisplay;
    }
  }

  let displayNode = Array.from(nameEl.childNodes).find((node) => {
    return (
      node.nodeType === Node.ELEMENT_NODE &&
      node.classList &&
      node.classList.contains("lme-display-name")
    );
  });

  if (!displayNode) {
    Array.from(nameEl.childNodes).forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList &&
        node.classList.contains("utitle")
      ) {
        return;
      }
      nameEl.removeChild(node);
    });

    displayNode = document.createElement("span");
    displayNode.className = "lme-display-name";
    nameEl.appendChild(displayNode);
  }

  if (displayNode.textContent !== displayName) {
    displayNode.textContent = displayName;
  }
}

function buildResolvedStyle(settings) {
  const baseSize = 14;
  const globalFont = resolveFontCssValue(settings.globalFont) || "inherit";
  const nameScale = clamp(parseNumber(settings.nameScale, 127), 60, 180) / 100;
  const clockScale = clamp(parseNumber(settings.clockScale, 120), 60, 180) / 100;
  const lastMoveScale = clamp(parseNumber(settings.lastMoveScale, 105), 60, 180) / 100;
  const evalTextScale = clamp(parseNumber(settings.evalTextScale, 90), 60, 180) / 100;
  const evalWidth = parseNumber(settings.evalBarWidth, 22);
  const evalBarBorderWidth = Math.max(0, parseNumber(settings.evalBarBorderWidth, 0));
  const evalTextGap = Math.max(0, parseNumber(settings.evalTextGap, 0));
  const cardWidthScale = clamp(parseNumber(settings.cardWidthScale, 100), 50, 200) / 100;

  const rawCardHeight = clamp(parseNumber(settings.cardHeight, 74), 52, 180);
  const cardPaddingX = Math.max(0, parseNumber(settings.cardPaddingX, 16));
  const cardHeight = clamp(Math.round(rawCardHeight * 0.9), 52, 160);
  const clockSizePx = Math.max(11, baseSize * 0.95 * clockScale);
  const clockLabelHeight = Math.max(evalWidth, Math.round(clockSizePx * 1.15));
  const clockLabelPaddingX = Math.max(4, Math.round(clockSizePx * 0.35));
  const clockLabelRadius = Math.max(3, Math.round(clockSizePx * 0.25));
  const clockSlotWidth = Math.max(48, Math.round(clockSizePx * 3.2));
  const baseCardWidth = clamp(
    Math.round(rawCardHeight * 3.75 + cardPaddingX * 2 + clockSlotWidth * 2),
    340,
    640
  );
  const cardWidth = Math.round(baseCardWidth * cardWidthScale);

  return {
    showEvalText: Boolean(settings.showEvalText),
    hideFlags: Boolean(settings.hideFlags),
    hideTitle: Boolean(settings.hideTitle),
    onlyPlaying: Boolean(settings.onlyPlaying),
    viewportPadding: Math.max(0, parseNumber(settings.viewportPadding, 14)),
    gridGap: Math.max(0, parseNumber(settings.gridGap, 22)),
    cardsPerRow: clamp(parseNumber(settings.cardsPerRow, 4), 1, 12),
    cardHeight,
    cardWidth,
    cardPaddingX,
    cardPaddingY: Math.max(0, parseNumber(settings.cardPaddingY, 8)),
    playerRowGap: Math.max(0, parseNumber(settings.playerRowGap, 9)),
    inlineGap: Math.max(0, parseNumber(settings.inlineGap, 6)),
    cardRadius: Math.max(0, parseNumber(settings.cardRadius, 10)),
    cardBorderWidth: Math.max(0, parseNumber(settings.cardBorderWidth, 0)),
    cardBorderColor: colorWithOpacity(settings.cardBorderColor, settings.cardBorderOpacity, "#000000", 100),
    pageBg: settings.pageBgColor,
    cardBg: colorWithOpacity(settings.cardBgColor, settings.cardBgOpacity, "#474747", 100),
    globalFont,
    titleBoldness: settings.titleBoldness,
    titleColor: colorWithOpacity(settings.titleColor, settings.titleOpacity, "#e69900", 100),
    flagOpacity: String(parseOpacity(settings.flagOpacity, 100)),
    whiteNameFont: globalFont,
    whiteNameBoldness: settings.whiteNameBoldness,
    whiteNameColor: colorWithOpacity(settings.whiteNameColor, settings.whiteNameOpacity, "#000000", 100),
    whiteBoxColor: colorWithOpacity(settings.whiteBoxColor, settings.whiteBoxOpacity, "#ffffff", 100),
    blackNameFont: globalFont,
    blackNameBoldness: settings.blackNameBoldness,
    blackNameColor: colorWithOpacity(settings.blackNameColor, settings.blackNameOpacity, "#ffffff", 100),
    blackBoxColor: colorWithOpacity(settings.blackBoxColor, settings.blackBoxOpacity, "#000000", 100),
    nameSize: `${(baseSize * nameScale).toFixed(2)}px`,
    evalTextSize: `${(baseSize * evalTextScale).toFixed(2)}px`,
    evalTextGap: `${evalTextGap}px`,
    lastMoveTextSize: `${Math.max(11, baseSize * 0.95 * lastMoveScale).toFixed(2)}px`,
    evalBarBorderWidth: `${evalBarBorderWidth}px`,
    evalBarBorderColor: colorWithOpacity(
      settings.evalBarBorderColor,
      settings.evalBarBorderOpacity,
      "#ffffff",
      18
    ),
    whiteClockFont: globalFont,
    whiteClockBoldness: settings.whiteClockBoldness,
    whiteClockColor: colorWithOpacity(settings.whiteClockColor, settings.whiteClockOpacity, "#ffffff", 100),
    whiteClockBgColor: colorWithOpacity(settings.whiteClockBgColor, settings.whiteClockBgOpacity, "#333333", 100),
    blackClockFont: globalFont,
    blackClockBoldness: settings.blackClockBoldness,
    blackClockColor: colorWithOpacity(settings.blackClockColor, settings.blackClockOpacity, "#ffffff", 100),
    blackClockBgColor: colorWithOpacity(settings.blackClockBgColor, settings.blackClockBgOpacity, "#333333", 100),
    lastMoveColor: colorWithOpacity(settings.lastMoveColor, settings.lastMoveOpacity, "#d1d1d1", 100),
    lastMoveBgColor: colorWithOpacity(settings.lastMoveBgColor, settings.lastMoveBgOpacity, "#424242", 100),
    evalTextColor: colorWithOpacity(settings.evalTextColor, settings.evalTextOpacity, "#ffffff", 100),
    evalTextBgColor: colorWithOpacity(settings.evalTextBgColor, settings.evalTextBgOpacity, "#2a2a2a", 100),
    winBgColor: colorWithOpacity(settings.winBgColor, settings.winBgOpacity, "#5F8B2C", 100),
    winTextColor: colorWithOpacity(settings.winTextColor, settings.winTextOpacity, "#ffffff", 100),
    lossBgColor: colorWithOpacity(settings.lossBgColor, settings.lossBgOpacity, "#BD392D", 100),
    lossTextColor: colorWithOpacity(settings.lossTextColor, settings.lossTextOpacity, "#ffffff", 100),
    drawBgColor: colorWithOpacity(settings.drawBgColor, settings.drawBgOpacity, "#8a8a8a", 100),
    drawTextColor: colorWithOpacity(settings.drawTextColor, settings.drawTextOpacity, "#ffffff", 100),
    clockSize: `${clockSizePx.toFixed(2)}px`,
    clockRowHeight: `${Math.max(2, evalWidth)}px`,
    clockLabelHeight: `${clockLabelHeight}px`,
    clockLabelPaddingX: `${clockLabelPaddingX}px`,
    clockLabelRadius: `${clockLabelRadius}px`
  };
}

function setRootVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function applyResolvedStyle(resolvedStyle) {
  setRootVar("--lme-page-bg", resolvedStyle.pageBg);
  setRootVar("--lme-viewport-padding", `${resolvedStyle.viewportPadding}px`);
  setRootVar("--lme-grid-gap", `${resolvedStyle.gridGap}px`);
  setRootVar("--lme-columns", String(resolvedStyle.cardsPerRow));
  setRootVar("--lme-card-height", `${resolvedStyle.cardHeight}px`);
  setRootVar("--lme-card-width", `${resolvedStyle.cardWidth}px`);
  setRootVar("--lme-card-padding-x", `${resolvedStyle.cardPaddingX}px`);
  setRootVar("--lme-card-padding-y", `${resolvedStyle.cardPaddingY}px`);
  setRootVar("--lme-player-row-gap", `${resolvedStyle.playerRowGap}px`);
  setRootVar("--lme-inline-gap", `${resolvedStyle.inlineGap}px`);
  setRootVar("--lme-card-radius", `${resolvedStyle.cardRadius}px`);
  setRootVar("--lme-card-border-width", `${resolvedStyle.cardBorderWidth}px`);
  setRootVar("--lme-card-border-color", resolvedStyle.cardBorderColor);
  setRootVar("--lme-card-bg", resolvedStyle.cardBg);
  setRootVar("--lme-global-font", resolvedStyle.globalFont);
  setRootVar("--lme-name-font", resolvedStyle.globalFont);
  setRootVar("--lme-clock-font", resolvedStyle.globalFont);
  setRootVar("--lme-title-color", resolvedStyle.titleColor);
  setRootVar("--lme-title-weight", resolvedStyle.titleBoldness);

  setRootVar("--lme-name-size", resolvedStyle.nameSize);
  setRootVar("--lme-white-name-font", resolvedStyle.whiteNameFont);
  setRootVar("--lme-white-name-weight", resolvedStyle.whiteNameBoldness);
  setRootVar("--lme-white-name-color", resolvedStyle.whiteNameColor);
  setRootVar("--lme-white-box-color", resolvedStyle.whiteBoxColor);
  setRootVar("--lme-black-name-font", resolvedStyle.blackNameFont);
  setRootVar("--lme-black-name-weight", resolvedStyle.blackNameBoldness);
  setRootVar("--lme-black-name-color", resolvedStyle.blackNameColor);
  setRootVar("--lme-black-box-color", resolvedStyle.blackBoxColor);
  setRootVar("--lme-flag-opacity", resolvedStyle.flagOpacity);

  setRootVar("--lme-clock-size", resolvedStyle.clockSize);
  setRootVar("--lme-clock-row-height", resolvedStyle.clockRowHeight);
  setRootVar("--lme-clock-label-height", resolvedStyle.clockLabelHeight);
  setRootVar("--lme-clock-label-padding-x", resolvedStyle.clockLabelPaddingX);
  setRootVar("--lme-clock-label-radius", resolvedStyle.clockLabelRadius);
  setRootVar("--lme-white-clock-font", resolvedStyle.whiteClockFont);
  setRootVar("--lme-white-clock-weight", resolvedStyle.whiteClockBoldness);
  setRootVar("--lme-white-clock-color", resolvedStyle.whiteClockColor);
  setRootVar("--lme-white-clock-bg", resolvedStyle.whiteClockBgColor);
  setRootVar("--lme-black-clock-font", resolvedStyle.blackClockFont);
  setRootVar("--lme-black-clock-weight", resolvedStyle.blackClockBoldness);
  setRootVar("--lme-black-clock-color", resolvedStyle.blackClockColor);
  setRootVar("--lme-black-clock-bg", resolvedStyle.blackClockBgColor);
  setRootVar("--lme-last-move-color", resolvedStyle.lastMoveColor);
  setRootVar("--lme-last-move-bg", resolvedStyle.lastMoveBgColor);
  setRootVar("--lme-last-move-size", resolvedStyle.lastMoveTextSize);
  setRootVar("--lme-eval-border-width", resolvedStyle.evalBarBorderWidth);
  setRootVar("--lme-eval-border-color", resolvedStyle.evalBarBorderColor);
  setRootVar("--lme-eval-text-color", resolvedStyle.evalTextColor);
  setRootVar("--lme-eval-text-bg", resolvedStyle.evalTextBgColor);
  setRootVar("--lme-eval-text-gap", resolvedStyle.evalTextGap);

  setRootVar("--lme-win-bg", resolvedStyle.winBgColor);
  setRootVar("--lme-win-color", resolvedStyle.winTextColor);
  setRootVar("--lme-loss-bg", resolvedStyle.lossBgColor);
  setRootVar("--lme-loss-color", resolvedStyle.lossTextColor);
  setRootVar("--lme-draw-bg", resolvedStyle.drawBgColor);
  setRootVar("--lme-draw-color", resolvedStyle.drawTextColor);
  setRootVar("--lme-eval-text-size", resolvedStyle.evalTextSize);

  const root = document.documentElement;
  root.classList.toggle("lme-hide-eval-text", !resolvedStyle.showEvalText);
  root.classList.toggle("lme-hide-flags", resolvedStyle.hideFlags);
  root.classList.toggle("lme-hide-titles", resolvedStyle.hideTitle);
  root.classList.toggle("lme-only-playing", resolvedStyle.onlyPlaying);
}

function getActiveMultiboard() {
  const candidates = Array.from(
    document.querySelectorAll("main.analyse.is-relay .study__multiboard")
  ).filter((board) => board.querySelector(".now-playing .mini-game"));

  if (!candidates.length) return null;

  return (
    candidates.find((candidate) => candidate.offsetParent !== null || candidate.getClientRects().length) ||
    null
  );
}

function getMiniGameChapterId(game) {
  if (!game) return "";
  const chapterClass = Array.from(game.classList).find((className) => className.startsWith("chap-"));
  return chapterClass ? chapterClass.slice(5) : "";
}

function dispatchVisibleBoardPreload(payload, signature, requestId, attempt = 0) {
  if (requestId !== preloadDispatchNonce || !latestSettings.enabled) return;

  if (document.documentElement.dataset.lmeBridgeReady !== "1") {
    if (attempt >= 20) return;
    preloadTimer = window.setTimeout(() => {
      dispatchVisibleBoardPreload(payload, signature, requestId, attempt + 1);
    }, 150);
    return;
  }

  preloadedBoardSetSignatures.add(signature);
  window.dispatchEvent(
    new CustomEvent("lme-preload-visible-chapters", {
      detail: payload
    })
  );
}

function scheduleVisibleBoardPreload(multiboard) {
  if (!multiboard || document.hidden || !latestSettings.enabled) return;

  const games = Array.from(multiboard.querySelectorAll(".now-playing .mini-game"));
  const chapterIds = games.map(getMiniGameChapterId).filter(Boolean);
  if (chapterIds.length < 2) return;

  const signature = chapterIds.join("|");
  if (preloadedBoardSetSignatures.has(signature)) return;

  const activeChapterId =
    getMiniGameChapterId(multiboard.querySelector(".now-playing .mini-game.active")) || chapterIds[0];
  const requestId = ++preloadDispatchNonce;

  clearTimeout(preloadTimer);
  preloadTimer = window.setTimeout(() => {
    dispatchVisibleBoardPreload(
      {
        chapterIds,
        activeChapterId,
        delayMs: 220
      },
      signature,
      requestId
    );
  }, 700);
}

function classifyMiniGames(multiboard, nameOverrideMap, options = {}) {
  multiboard.querySelectorAll(".now-playing .mini-game").forEach((game) => {
    const hasResult = Boolean(game.querySelector(".mini-game__result"));
    const hasClock = Boolean(game.querySelector(".mini-game__clock"));
    const isPlaying = hasClock && !hasResult;
    const gauge = game.querySelector(".mini-game__gauge");
    const blackFill = gauge ? gauge.querySelector(".mini-game__gauge__black") : null;
    const blackPercent = blackFill ? blackFill.style.height || "50%" : "50%";

    game.classList.toggle("lme-is-playing", isPlaying);
    game.classList.toggle("lme-is-finished", !isPlaying);

    if (gauge) {
      if (gauge.style.getPropertyValue("--lme-black-pct") !== blackPercent) {
        gauge.style.setProperty("--lme-black-pct", blackPercent);
      }
    }

    const names = game.querySelectorAll(".name");
    names.forEach((nameEl) => {
      const originalName = extractOriginalPlayerName(nameEl);
      const overrideName = nameOverrideMap.get(normalizeNameOverrideKey(originalName));
      const displayName = overrideName || getDefaultDisplayName(originalName);
      applyDisplayName(nameEl, displayName, Boolean(options.hideTitle));
    });

    // Extract Last Move & Eval
    const evalText = gauge ? (gauge.getAttribute('title') || '') : '';
    const boardWrap = game.querySelector('.cg-wrap');
    let moveText = '';
    
    if (boardWrap) {
      const isWhiteBottom = boardWrap.classList.contains('orientation-white');
      const squares = Array.from(boardWrap.querySelectorAll('.last-move[style*="translate"]'));
      
      if (squares.length === 2) {
        const getCoords = (el) => {
          const match = el.style.transform.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
          if (!match) return null;
          const container = boardWrap.querySelector('cg-container');
          let width = 184;
          if (container) {
            const cw = parseInt(container.style.width || '0', 10);
            const ch = parseInt(container.style.height || '0', 10);
            width = cw > 0 ? cw : (ch > 0 ? ch : 184);
          }
          const sqSize = width / 8;
          return {
            x: Math.round(parseFloat(match[1]) / sqSize),
            y: Math.round(parseFloat(match[2]) / sqSize)
          };
        };

        const s1 = getCoords(squares[0]);
        const s2 = getCoords(squares[1]);

        if (s1 && s2 && !isNaN(s1.x) && !isNaN(s2.x) && !(s1.x === 0 && s1.y === 0 && s2.x === 0 && s2.y === 0)) {
          const toAlgebraic = (c) => {
            const file = isWhiteBottom ? c.x : 7 - c.x;
            const rank = isWhiteBottom ? 7 - c.y : c.y;
            return String.fromCharCode(97 + file) + (rank + 1);
          };

          const s1Piece = boardWrap.querySelector(`piece[style*="${squares[0].style.transform}"]`);
          const s2Piece = boardWrap.querySelector(`piece[style*="${squares[1].style.transform}"]`);
          
          let src = s1, dst = s2, pieceEl = s2Piece;
          if (s1Piece && !s2Piece) { src = s2; dst = s1; pieceEl = s1Piece; }
          else if (!s1Piece && s2Piece) { src = s1; dst = s2; pieceEl = s2Piece; }
          
          let pChar = '';
          if (pieceEl) {
            if (pieceEl.classList.contains('knight')) pChar = 'N';
            else if (pieceEl.classList.contains('bishop')) pChar = 'B';
            else if (pieceEl.classList.contains('rook')) pChar = 'R';
            else if (pieceEl.classList.contains('queen')) pChar = 'Q';
            else if (pieceEl.classList.contains('king')) pChar = 'K';
          }
          moveText = `${pChar}${toAlgebraic(src)}-${toAlgebraic(dst)}`;
        }
      }
    }

    let moveEl = game.querySelector('.lme-move-text');
    if (!moveEl) {
      moveEl = document.createElement('div');
      moveEl.className = 'lme-move-text';
      game.appendChild(moveEl);
    }
    let moveInnerEl = moveEl.querySelector('.lme-move-text__inner');
    if (!moveInnerEl) {
      moveInnerEl = document.createElement('span');
      moveInnerEl.className = 'lme-move-text__inner';
      moveEl.appendChild(moveInnerEl);
    }
    moveEl.classList.toggle('lme-empty', !moveText);
    if (moveInnerEl.textContent !== moveText) {
      moveInnerEl.textContent = moveText;
    }

    let evalEl = game.querySelector('.lme-eval-text');
    if (!evalEl) {
      evalEl = document.createElement('div');
      evalEl.className = 'lme-eval-text';
      game.appendChild(evalEl);
    }
    if (evalEl.textContent !== evalText) {
      evalEl.textContent = evalText;
    }

    syncMiniGameStatusLabels(game);
  });
}

function normalizeStatusLabelText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function readMiniGamePlayerLabel(player) {
  if (!player) {
    return { text: "", running: false, good: false, bad: false, clock: false };
  }

  const clock = player.querySelector(".mini-game__clock");
  if (clock) {
    return {
      text: normalizeStatusLabelText(clock.textContent),
      running: clock.classList.contains("clock--run"),
      good: false,
      bad: false,
      clock: true
    };
  }

  const result = player.querySelector(".mini-game__result");
  if (!result) {
    return { text: "", running: false, good: false, bad: false, clock: false };
  }

  const tagName = result.tagName.toLowerCase();
  return {
    text: normalizeStatusLabelText(result.textContent),
    running: false,
    good: tagName === "good" || result.classList.contains("good"),
    bad: tagName === "bad" || result.classList.contains("bad"),
    clock: false
  };
}

function syncMiniGameStatusLabels(game) {
  const topPlayer = game.querySelector(".mini-game__player:first-of-type");
  const bottomPlayer = game.querySelector(".mini-game__player:last-of-type");
  const rightLabel = readMiniGamePlayerLabel(topPlayer);
  const leftLabel = readMiniGamePlayerLabel(bottomPlayer);

  if (leftLabel.text) game.dataset.lmeLeftLabel = leftLabel.text;
  else delete game.dataset.lmeLeftLabel;

  if (rightLabel.text) game.dataset.lmeRightLabel = rightLabel.text;
  else delete game.dataset.lmeRightLabel;

  game.classList.toggle("lme-has-left-label", Boolean(leftLabel.text));
  game.classList.toggle("lme-has-right-label", Boolean(rightLabel.text));
  game.classList.toggle("lme-left-label-clock", leftLabel.clock);
  game.classList.toggle("lme-right-label-clock", rightLabel.clock);
  game.classList.remove("lme-left-label-running");
  game.classList.remove("lme-right-label-running");
  game.classList.toggle("lme-left-label-good", leftLabel.good);
  game.classList.toggle("lme-left-label-bad", leftLabel.bad);
  game.classList.toggle("lme-left-label-draw", !leftLabel.clock && leftLabel.text && !leftLabel.good && !leftLabel.bad);
  game.classList.toggle("lme-right-label-good", rightLabel.good);
  game.classList.toggle("lme-right-label-bad", rightLabel.bad);
  game.classList.toggle("lme-right-label-draw", !rightLabel.clock && rightLabel.text && !rightLabel.good && !rightLabel.bad);
}

function lockMiniGameLinks(multiboard) {
  multiboard.querySelectorAll(".now-playing .mini-game").forEach((game) => {
    if (!game.dataset.lmeHref && game.getAttribute("href")) {
      game.dataset.lmeHref = game.getAttribute("href");
    }

    game.removeAttribute("href");
    game.setAttribute("tabindex", "-1");
    game.setAttribute("aria-disabled", "true");
    game.setAttribute("draggable", "false");
  });
}

function syncMultiboardLayout() {
  const root = document.documentElement;

  if (!latestSettings.enabled) {
    restoreMiniGameLinks();
    if (activeMultiboard) {
      activeMultiboard.classList.remove("lme-target");
      activeMultiboard = null;
    }
    root.classList.remove("lme-active");
    return;
  }

  const multiboard = getActiveMultiboard();
  if (!multiboard) {
    restoreMiniGameLinks();
    if (activeMultiboard) {
      activeMultiboard.classList.remove("lme-target");
      activeMultiboard = null;
    }
    root.classList.remove("lme-active");
    return;
  }

  const resolvedStyle = buildResolvedStyle(latestSettings);
  const nameOverrideMap = buildNameOverrideMap(latestSettings);

  if (activeMultiboard && activeMultiboard !== multiboard) {
    activeMultiboard.classList.remove("lme-target");
  }
  if (activeMultiboard !== multiboard) {
    multiboard.classList.add("lme-target");
    activeMultiboard = multiboard;
  }
  classifyMiniGames(multiboard, nameOverrideMap, { hideTitle: resolvedStyle.hideTitle });
  lockMiniGameLinks(multiboard);
  root.classList.add("lme-active");
  scheduleVisibleBoardPreload(multiboard);
}

function scheduleSync() {
  if (syncRaf) return;
  syncRaf = requestAnimationFrame(() => {
    syncRaf = 0;
    syncMultiboardLayout();
  });
}

function bindObserver() {
  if (multiboardObserver || !document.body) return;

  multiboardObserver = new MutationObserver(() => {
    scheduleSync();
  });

  multiboardObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"]
  });
}

function bindResize() {
  if (resizeBound) return;
  window.addEventListener("resize", scheduleSync);
  resizeBound = true;
}

function applySettings(settings) {
  latestSettings = mergeStoredSettings({ ...latestSettings, ...(settings || {}) });
  applyResolvedStyle(buildResolvedStyle(latestSettings));
  bindObserver();
  bindResize();
  scheduleSync();
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (storedSettings) => {
  applySettings(storedSettings);
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateStyles") {
    applySettings(request.settings);
  }
});
