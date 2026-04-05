document.addEventListener("DOMContentLoaded", () => {
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

  const CONTROL_IDS = [
    "enabled",
    "onlyPlaying",
    "showEvalText",
    "hideFlags",
    "hideTitle",
    "titleBoldness",
    "titleColor",
    "titleOpacity",
    "cardsPerRow",
    "cardWidthScale",
    "viewportPadding",
    "gridGap",
    "playerRowGap",
    "nameScale",
    "evalTextScale",
    "clockScale",
    "lastMoveScale",
    "evalBarWidth",
    "evalBarBorderWidth",
    "evalBarBorderColor",
    "evalBarBorderOpacity",
    "evalTextGap",
    "titleOpacity",
    "flagOpacity",
    "globalFont",
    "whiteNameBoldness",
    "whiteNameColor",
    "whiteNameOpacity",
    "whiteBoxColor",
    "whiteBoxOpacity",
    "blackNameBoldness",
    "blackNameColor",
    "blackNameOpacity",
    "blackBoxColor",
    "blackBoxOpacity",
    "whiteClockBoldness",
    "whiteClockColor",
    "whiteClockOpacity",
    "whiteClockBgColor",
    "whiteClockBgOpacity",
    "blackClockBoldness",
    "blackClockColor",
    "blackClockOpacity",
    "blackClockBgColor",
    "blackClockBgOpacity",
    "lastMoveColor",
    "lastMoveOpacity",
    "lastMoveBgColor",
    "lastMoveBgOpacity",
    "evalTextColor",
    "evalTextOpacity",
    "evalTextBgColor",
    "evalTextBgOpacity",
    "cardRadius",
    "cardBorderWidth",
    "cardBorderColor",
    "pageBgColor",
    "cardBgColor",
    "cardBgOpacity",
    "winBgColor",
    "winBgOpacity",
    "winTextColor",
    "lossBgColor",
    "lossBgOpacity",
    "lossTextColor",
    "drawBgColor",
    "drawBgOpacity",
    "drawTextColor"
  ];

  const RANGE_INPUT_IDS = [
    "cardsPerRow",
    "cardWidthScale",
    "viewportPadding",
    "gridGap",
    "playerRowGap",
    "nameScale",
    "evalTextScale",
    "clockScale",
    "lastMoveScale",
    "evalBarWidth",
    "evalBarBorderWidth",
    "evalBarBorderOpacity",
    "evalTextGap",
    "flagOpacity",
    "cardBgOpacity",
    "whiteNameOpacity",
    "whiteBoxOpacity",
    "blackNameOpacity",
    "blackBoxOpacity",
    "whiteClockOpacity",
    "whiteClockBgOpacity",
    "blackClockOpacity",
    "blackClockBgOpacity",
    "lastMoveOpacity",
    "lastMoveBgOpacity",
    "evalTextOpacity",
    "evalTextBgOpacity",
    "winBgOpacity",
    "lossBgOpacity",
    "drawBgOpacity",
    "cardRadius",
    "cardBorderWidth"
  ];

  const elements = Object.fromEntries(
    CONTROL_IDS.map((id) => [id, document.getElementById(id)])
  );

  const ui = {
    customGlobalFont: document.getElementById("customGlobalFont"),
    saveCustomGlobalFont: document.getElementById("saveCustomGlobalFont"),
    nameOverrideList: document.getElementById("nameOverrideList"),
    addNameOverride: document.getElementById("addNameOverride"),
    exportNameOverrides: document.getElementById("exportNameOverrides"),
    importNameOverrides: document.getElementById("importNameOverrides"),
    importNameOverridesFile: document.getElementById("importNameOverridesFile"),
    nameOverrideStatus: document.getElementById("nameOverrideStatus"),
    exportAddonSettings: document.getElementById("exportAddonSettings"),
    importAddonSettings: document.getElementById("importAddonSettings"),
    importAddonSettingsFile: document.getElementById("importAddonSettingsFile"),
    settingsTransferStatus: document.getElementById("settingsTransferStatus")
  };

  const builtInFontOptions = Array.from(elements.globalFont.options).map((option) => ({
    value: option.value,
    label: option.textContent || option.value
  }));

  const rangeValueMap = Object.fromEntries(
    RANGE_INPUT_IDS.map((id) => [id, document.getElementById(`${id}Val`)])
  );

  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
  const resetAllSettingsButton = document.getElementById("resetAllSettings");

  let state = mergeStoredSettings(DEFAULT_SETTINGS);
  let persistTimer = 0;

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

  function normalizeFontKey(value) {
    return normalizeFontStack(value) || normalizeFontLabel(value);
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

    const fonts = [];
    const seen = new Set();

    value.forEach((entry) => {
      const font = String(entry || "").trim();
      if (!font) return;
      const key = normalizeFontKey(font);
      if (!key || seen.has(key)) return;
      seen.add(key);
      fonts.push(font);
    });

    return fonts;
  }

  function sanitizeNameOverrideDrafts(value, { keepEmpty = false } = {}) {
    if (!Array.isArray(value)) return [];

    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const source = String(entry.source ?? entry.from ?? entry.name ?? "").trim();
        const target = String(entry.target ?? entry.to ?? entry.text ?? entry.replacement ?? "").trim();
        if (!keepEmpty && !source && !target) return null;
        return { source, target };
      })
      .filter(Boolean);
  }

  function mergeStoredSettings(raw) {
    const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) };
    merged.customFonts = sanitizeCustomFonts(raw?.customFonts);
    merged.nameOverrides = sanitizeNameOverrideDrafts(raw?.nameOverrides, { keepEmpty: true });
    merged.showEvalText =
      typeof raw?.showEvalText === "boolean"
        ? raw.showEvalText
        : typeof raw?.showEvalBar === "boolean"
          ? raw.showEvalBar
          : DEFAULT_SETTINGS.showEvalText;
    return merged;
  }

  function updateSliderLabels() {
    Object.entries(rangeValueMap).forEach(([key, label]) => {
      if (!elements[key] || !label) return;
      label.textContent = String(elements[key].value);
    });
  }

  function collectFixedSettingsFromUi() {
    const settings = {};

    Object.entries(elements).forEach(([key, element]) => {
      if (!element) return;
      settings[key] =
        element.type === "checkbox" ? Boolean(element.checked) : String(element.value);
    });

    return settings;
  }

  function openTab(target) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tabTarget === target;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.tabPanel === target);
    });
  }

  function notifyActiveTab(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length || typeof tabs[0].id !== "number") return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "updateStyles", settings }, () => {
        void chrome.runtime.lastError;
      });
    });
  }

  function persistState() {
    chrome.storage.sync.set(state, () => {
      void chrome.runtime.lastError;
    });
  }

  function scheduleStatePersist() {
    if (persistTimer) {
      window.clearTimeout(persistTimer);
    }

    persistTimer = window.setTimeout(() => {
      persistTimer = 0;
      persistState();
    }, 150);
  }

  function flushStatePersist() {
    if (persistTimer) {
      window.clearTimeout(persistTimer);
      persistTimer = 0;
    }

    persistState();
  }

  function setStatus(element, message, tone = "") {
    element.textContent = message;
    element.className = "status-line";
    if (tone) {
      element.classList.add(`is-${tone}`);
    }
  }

  function setNameOverrideStatus(message, tone = "") {
    setStatus(ui.nameOverrideStatus, message, tone);
  }

  function setSettingsStatus(message, tone = "") {
    setStatus(ui.settingsTransferStatus, message, tone);
  }

  function syncCustomFontInput() {
    const currentValue = String(state.globalFont || "").trim();
    const builtInKeys = new Set(
      builtInFontOptions.map((option) => normalizeFontKey(option.value || option.label))
    );

    if (!currentValue || builtInKeys.has(normalizeFontKey(currentValue))) {
      ui.customGlobalFont.value = "";
      return;
    }

    ui.customGlobalFont.value = currentValue;
  }

  function rebuildGlobalFontOptions(selectedValue = state.globalFont) {
    const select = elements.globalFont;
    const builtInKeys = new Set(
      builtInFontOptions.map((option) => normalizeFontKey(option.value || option.label))
    );
    const currentCustomFonts = sanitizeCustomFonts([
      ...state.customFonts,
      selectedValue
    ]).filter((font) => !builtInKeys.has(normalizeFontKey(font)));

    select.innerHTML = "";

    builtInFontOptions.forEach((option) => {
      select.appendChild(new Option(option.label, option.value));
    });

    if (currentCustomFonts.length) {
      const customGroup = document.createElement("optgroup");
      customGroup.label = "Saved Custom Fonts";
      currentCustomFonts.forEach((font) => {
        customGroup.appendChild(new Option(font, font));
      });
      select.appendChild(customGroup);
    }

    select.value = String(selectedValue || "");
    if (String(selectedValue || "") && select.value !== String(selectedValue)) {
      const fallbackOption = new Option(String(selectedValue), String(selectedValue));
      select.appendChild(fallbackOption);
      select.value = String(selectedValue);
    }

    syncCustomFontInput();
  }

  function createNameOverrideRow(entry, index) {
    const item = document.createElement("div");
    item.className = "replacement-item";
    item.dataset.index = String(index);

    const inputs = document.createElement("div");
    inputs.className = "replacement-inputs";

    const sourceInput = document.createElement("input");
    sourceInput.type = "text";
    sourceInput.placeholder = "Last name, First name";
    sourceInput.value = entry.source || "";
    sourceInput.dataset.field = "source";

    const targetInput = document.createElement("input");
    targetInput.type = "text";
    targetInput.placeholder = "Display text";
    targetInput.value = entry.target || "";
    targetInput.dataset.field = "target";

    inputs.appendChild(sourceInput);
    inputs.appendChild(targetInput);

    const rowActions = document.createElement("div");
    rowActions.className = "replacement-row-actions";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "action-btn small-btn";
    removeButton.dataset.action = "remove-name-override";
    removeButton.textContent = "Remove";

    rowActions.appendChild(removeButton);
    item.appendChild(inputs);
    item.appendChild(rowActions);

    return item;
  }

  function renderNameOverrides() {
    ui.nameOverrideList.innerHTML = "";

    if (!state.nameOverrides.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No replacements yet.";
      ui.nameOverrideList.appendChild(emptyState);
      return;
    }

    state.nameOverrides.forEach((entry, index) => {
      ui.nameOverrideList.appendChild(createNameOverrideRow(entry, index));
    });
  }

  function getCompleteNameOverrides() {
    return sanitizeNameOverrideDrafts(state.nameOverrides).filter(
      (entry) => entry.source && entry.target
    );
  }

  function saveAndNotify(options = {}) {
    const { rebuildFonts = false } = options;

    state = mergeStoredSettings({
      ...state,
      ...collectFixedSettingsFromUi(),
      customFonts: state.customFonts,
      nameOverrides: state.nameOverrides
    });

    if (rebuildFonts) {
      rebuildGlobalFontOptions(state.globalFont);
    }

    notifyActiveTab(state);
    scheduleStatePersist();
  }

  function applySettingsToUi(settings) {
    state = mergeStoredSettings(settings);

    Object.entries(elements).forEach(([key, element]) => {
      if (!element || !(key in state)) return;
      if (element.type === "checkbox") {
        element.checked = Boolean(state[key]);
      } else {
        element.value = String(state[key]);
      }
    });

    rebuildGlobalFontOptions(state.globalFont);
    renderNameOverrides();
    updateSliderLabels();
  }

  function findBuiltInFontValue(rawValue) {
    const normalized = normalizeFontKey(rawValue);
    if (!normalized) return "";

    const match = builtInFontOptions.find((option) => {
      return (
        normalizeFontKey(option.value || option.label) === normalized ||
        normalizeFontLabel(option.label) === normalizeFontLabel(rawValue)
      );
    });

    return match ? match.value : "";
  }

  function useCustomGlobalFont() {
    const rawValue = String(ui.customGlobalFont.value || "").trim();
    if (!rawValue) return;

    const builtInValue = findBuiltInFontValue(rawValue);

    if (builtInValue) {
      state = mergeStoredSettings({
        ...state,
        globalFont: builtInValue
      });
    } else {
      state = mergeStoredSettings({
        ...state,
        globalFont: rawValue,
        customFonts: sanitizeCustomFonts([...state.customFonts, rawValue])
      });
    }

    applySettingsToUi(state);
    saveAndNotify({ rebuildFonts: true });
  }

  function parseImportedNameOverrides(rawText) {
    const trimmed = String(rawText || "").trim();
    if (!trimmed) return [];

    const parsed = JSON.parse(trimmed);
    const entries = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.nameOverrides)
        ? parsed.nameOverrides
        : null;

    if (!entries) {
      throw new Error("Expected an array or an object with a nameOverrides array.");
    }

    return sanitizeNameOverrideDrafts(entries).filter(
      (entry) => entry.source && entry.target
    );
  }

  function parseImportedAddonSettings(rawText) {
    const trimmed = String(rawText || "").trim();
    if (!trimmed) {
      throw new Error("Settings file is empty.");
    }

    const parsed = JSON.parse(trimmed);
    const payload = parsed?.settings && typeof parsed.settings === "object" ? parsed.settings : parsed;
    return mergeStoredSettings(payload);
  }

  function downloadTextFile(filename, contents, mimeType) {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }

  async function readTextFromFileInput(input) {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return "";
    return file.text();
  }

  function bindFixedControls() {
    Object.entries(elements).forEach(([key, input]) => {
      if (!input) return;
      const eventName = input.type === "range" ? "input" : "change";

      input.addEventListener(eventName, () => {
        updateSliderLabels();

        if (key === "globalFont") {
          state = mergeStoredSettings({
            ...state,
            globalFont: String(input.value)
          });
          syncCustomFontInput();
        }

        saveAndNotify();
      });

      if (input.type === "color") {
        input.addEventListener("input", () => {
          saveAndNotify();
        });
      }
    });
  }

  function bindDynamicControls() {
    ui.saveCustomGlobalFont.addEventListener("click", useCustomGlobalFont);

    ui.customGlobalFont.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      useCustomGlobalFont();
    });

    ui.addNameOverride.addEventListener("click", () => {
      state = mergeStoredSettings({
        ...state,
        nameOverrides: [...state.nameOverrides, { source: "", target: "" }]
      });
      renderNameOverrides();
      saveAndNotify();

      const lastInput = ui.nameOverrideList.querySelector(
        '.replacement-item:last-child input[data-field="source"]'
      );
      if (lastInput) lastInput.focus();
    });

    ui.nameOverrideList.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      const item = target.closest(".replacement-item");
      if (!item) return;

      const index = Number(item.dataset.index);
      const field = target.dataset.field;
      if (!Number.isInteger(index) || !field) return;

      const nextOverrides = state.nameOverrides.slice();
      const currentEntry = nextOverrides[index] || { source: "", target: "" };
      nextOverrides[index] = {
        ...currentEntry,
        [field]: target.value
      };

      state = mergeStoredSettings({
        ...state,
        nameOverrides: nextOverrides
      });

      saveAndNotify();
    });

    ui.nameOverrideList.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="remove-name-override"]');
      if (!button) return;

      const item = button.closest(".replacement-item");
      if (!item) return;

      const index = Number(item.dataset.index);
      if (!Number.isInteger(index)) return;

      const nextOverrides = state.nameOverrides.slice();
      nextOverrides.splice(index, 1);

      state = mergeStoredSettings({
        ...state,
        nameOverrides: nextOverrides
      });

      renderNameOverrides();
      saveAndNotify();
    });

    ui.exportNameOverrides.addEventListener("click", () => {
      const exportText = JSON.stringify(getCompleteNameOverrides(), null, 2);
      downloadTextFile("limultieval-name-replacements.json", exportText, "application/json");
      setNameOverrideStatus("Replacement file exported.", "success");
    });

    ui.importNameOverrides.addEventListener("click", () => {
      ui.importNameOverridesFile.click();
    });

    ui.importNameOverridesFile.addEventListener("change", async () => {
      try {
        const importedOverrides = parseImportedNameOverrides(
          await readTextFromFileInput(ui.importNameOverridesFile)
        );
        state = mergeStoredSettings({
          ...state,
          nameOverrides: importedOverrides
        });
        renderNameOverrides();
        saveAndNotify();
        setNameOverrideStatus(`Imported ${importedOverrides.length} replacement(s).`, "success");
      } catch (error) {
        setNameOverrideStatus(
          error instanceof Error ? error.message : "Import failed.",
          "error"
        );
      }
    });

    ui.exportAddonSettings.addEventListener("click", () => {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: mergeStoredSettings({
          ...state,
          ...collectFixedSettingsFromUi(),
          customFonts: state.customFonts,
          nameOverrides: state.nameOverrides
        })
      };
      downloadTextFile(
        "limultieval-settings.json",
        JSON.stringify(payload, null, 2),
        "application/json"
      );
      setSettingsStatus("Settings file exported.", "success");
    });

    ui.importAddonSettings.addEventListener("click", () => {
      ui.importAddonSettingsFile.click();
    });

    ui.importAddonSettingsFile.addEventListener("change", async () => {
      try {
        const importedSettings = parseImportedAddonSettings(
          await readTextFromFileInput(ui.importAddonSettingsFile)
        );
        applySettingsToUi(importedSettings);
        saveAndNotify({ rebuildFonts: true });
        setSettingsStatus("Settings file imported.", "success");
      } catch (error) {
        setSettingsStatus(
          error instanceof Error ? error.message : "Settings import failed.",
          "error"
        );
      }
    });

  }

  bindFixedControls();
  bindDynamicControls();
  window.addEventListener("pagehide", flushStatePersist);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openTab(button.dataset.tabTarget || "layoutTab");
    });
  });

  resetAllSettingsButton.addEventListener("click", () => {
    state = mergeStoredSettings(DEFAULT_SETTINGS);
    applySettingsToUi(state);
    setNameOverrideStatus("");
    setSettingsStatus("");
    saveAndNotify({ rebuildFonts: true });
  });

  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    applySettingsToUi(mergeStoredSettings(stored));
  });
});
