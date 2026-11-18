export function popupIcon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const use = document.createElementNS(ns, 'use');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', 'popup-icons.svg#' + name);
  svg.append(use);
  return svg;
}

function initNavigation() {
  const tablist = document.getElementById('sectionTabs');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"]')];
  const content = document.getElementById('settingsContent');
  const search = document.getElementById('settingSearch');
  const searchPanel = document.getElementById('searchPanel');
  const results = document.getElementById('searchResults');
  const count = document.getElementById('searchCount');
  const clear = document.getElementById('clearSearch');
  const narrow = matchMedia('(max-width: 460px)');
  const syncOrientation = () => tablist.setAttribute('aria-orientation', narrow.matches ? 'horizontal' : 'vertical');
  narrow.addEventListener('change', syncOrientation);
  syncOrientation();

  const stored = localStorage.getItem('lmePopupActiveTab');
  let active = tabs.some(tab => tab.dataset.tabTarget === stored) ? stored : tabs[0].dataset.tabTarget;
  let highlighted;
  const scrollPositions = new Map();

  function clearHighlight() {
    highlighted?.classList.remove('search-target');
    highlighted = null;
  }

  function showSection(id) {
    if (searchPanel.hidden) scrollPositions.set(active, content.scrollTop);
    clearHighlight();
    active = id;
    search.value = '';
    clear.hidden = true;
    searchPanel.hidden = true;
    for (const tab of tabs) {
      const selected = tab.dataset.tabTarget === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.tabPanel !== id;
    content.scrollTop = scrollPositions.get(id) || 0;
    localStorage.setItem('lmePopupActiveTab', id);
  }

  showSection(active);
  tabs.forEach(tab => tab.addEventListener('click', () => showSection(tab.dataset.tabTarget)));
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = narrow.matches ? 'ArrowRight' : 'ArrowDown';
    const previous = narrow.matches ? 'ArrowLeft' : 'ArrowUp';
    const destinations = { [next]: (index + 1) % tabs.length, [previous]: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    const tab = tabs[destinations[event.key]];
    showSection(tab.dataset.tabTarget);
    tab.focus();
  });

  const entries = panels.flatMap(panel => {
    const section = panel.querySelector('h2').textContent;
    return [...panel.querySelectorAll('.setting-row, [data-search-label]')].map(row => {
      const heading = row.closest('.settings-group')?.querySelector('h3, summary');
      const group = (heading?.querySelector('.group-name') || heading)?.textContent.trim();
      const label = row.querySelector('.row-label label');
      const control = label?.control || row;
      const keyWords = control.id.replace(/([a-z])([A-Z])/g, '$1 $2');
      return {
        row, control, panel, path: [section, group].filter(Boolean).join(' / '),
        label: row.dataset.searchLabel || label.textContent,
        terms: [keyWords, row.dataset.keywords, row.querySelector('.row-label small')?.textContent].filter(Boolean).join(' ')
      };
    });
  });

  function goToResult(entry) {
    showSection(entry.panel.dataset.tabPanel);
    const { row, control } = entry;
    const group = row.closest('details');
    if (group) group.open = true;
    row.classList.add('search-target');
    highlighted = row;
    control.focus({ preventScroll: true });
    row.scrollIntoView({ block: 'nearest' });
  }

  function updateSearch() {
    const normalize = text => text.toLowerCase().replaceAll('colour', 'color');
    const query = normalize(search.value.trim());
    clear.hidden = !search.value;
    if (!query) {
      showSection(active);
      return;
    }
    if (searchPanel.hidden) scrollPositions.set(active, content.scrollTop);
    clearHighlight();
    for (const panel of panels) panel.hidden = true;
    for (const tab of tabs) tab.setAttribute('aria-selected', 'false');
    searchPanel.hidden = false;
    const words = query.split(/\s+/);
    const matches = [];
    for (const entry of entries) {
      const label = normalize(entry.label);
      const direct = normalize(label + ' ' + entry.terms);
      const text = direct + ' ' + normalize(entry.path);
      if (!words.every(word => text.includes(word))) continue;
      let rank = 3;
      if (label === query) rank = 0;
      else if (words.every(word => label.includes(word))) rank = 1;
      else if (words.every(word => direct.includes(word))) rank = 2;
      matches.push({ entry, rank });
    }
    matches.sort((a, b) => a.rank - b.rank);
    const fragment = document.createDocumentFragment();
    for (const { entry } of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-result';
      const body = document.createElement('span');
      const label = document.createElement('strong');
      const path = document.createElement('small');
      label.textContent = entry.label;
      path.textContent = entry.path;
      body.append(label, path);
      button.append(body, popupIcon('arrow-right'));
      button.addEventListener('click', () => goToResult(entry));
      fragment.append(button);
    }
    results.replaceChildren(fragment);
    count.textContent = matches.length
      ? matches.length + (matches.length === 1 ? ' match' : ' matches')
      : 'No matching settings. Try a term like “clock” or “color”.';
    content.scrollTop = 0;
  }

  search.addEventListener('input', updateSearch);
  clear.addEventListener('click', () => { showSection(active); search.focus(); });
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      const first = results.querySelector('button');
      if (!first || searchPanel.hidden) return;
      event.preventDefault();
      if (event.key === 'Enter') first.click();
      else first.focus();
    }
  });
  results.addEventListener('keydown', event => {
    const button = event.target.closest('.search-result');
    if (!button) return;
    const destinations = {
      ArrowUp: button.previousElementSibling || search,
      ArrowDown: button.nextElementSibling || button,
      Home: results.firstElementChild,
      End: results.lastElementChild
    };
    if (destinations[event.key]) {
      event.preventDefault();
      destinations[event.key].focus();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape' && !searchPanel.hidden) {
      event.preventDefault();
      showSection(active);
      search.focus();
    } else if (!search.disabled && event.key === '/' && !event.target.matches('input[type="text"], input[type="number"], input[type="search"], select')) {
      event.preventDefault();
      search.focus();
    }
  });
  content.addEventListener('input', clearHighlight);
  content.addEventListener('focusin', event => {
    if (highlighted && !highlighted.contains(event.target)) clearHighlight();
  });
}

// Keep the range and color picker as the source of truth for sync and presets.
function initValueControl(input) {
  const isRange = input.type === 'range';
  const unit = input.dataset.unit || '';
  const row = input.closest('.setting-row');
  const label = input.labels[0];
  const wrapper = document.createElement('span');
  const field = document.createElement('label');
  const editor = document.createElement('input');
  const error = document.createElement('small');
  wrapper.className = isRange ? 'range-control' : 'color-control';
  field.className = 'exact-field';
  editor.id = input.id + 'Exact';
  field.htmlFor = editor.id;
  editor.className = 'exact-input';
  editor.autocomplete = 'off';
  editor.setAttribute('aria-describedby', 'exactEntryHint');
  const valueKind = { '%': 'percent', px: 'pixels' }[unit];
  editor.setAttribute('aria-label', [label.textContent, isRange ? valueKind : 'hex color'].filter(Boolean).join(', '));
  error.id = editor.id + 'Error';
  error.className = 'field-status value-error';
  error.setAttribute('aria-live', 'polite');

  input.before(wrapper);
  if (isRange) {
    editor.type = 'number';
    editor.inputMode = 'numeric';
    editor.min = input.min;
    editor.max = input.max;
    editor.step = input.step || '1';
    field.append(editor);
    if (unit) {
      const suffix = document.createElement('span');
      suffix.textContent = unit;
      suffix.setAttribute('aria-hidden', 'true');
      field.append(suffix);
    }
    wrapper.append(input, field);
  } else {
    editor.type = 'text';
    editor.spellcheck = false;
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.append(input);
    field.append(editor);
    wrapper.append(swatch, field);
  }
  row.append(error);

  const displayed = () => isRange ? input.value : input.value.toUpperCase();
  function clearError() {
    editor.removeAttribute('aria-invalid');
    editor.setAttribute('aria-describedby', 'exactEntryHint');
    if (error.textContent) error.textContent = '';
  }
  function refresh(resetDrafts) {
    if (resetDrafts) {
      editor.removeAttribute('data-draft');
      clearError();
    }
    if (!editor.hasAttribute('data-draft') && editor.value !== displayed()) editor.value = displayed();
    if (isRange) {
      if (unit) input.setAttribute('aria-valuetext', input.value + (unit === '%' ? '%' : ' ' + unit));
      const fill = (input.valueAsNumber - Number(input.min)) / (Number(input.max) - Number(input.min));
      input.style.setProperty('--fill', (fill * 100) + '%');
    } else {
      wrapper.style.setProperty('--swatch', input.value);
    }
  }
  function commit(leaving = false) {
    if (!editor.hasAttribute('data-draft')) return;
    let value = editor.value.trim();
    if (isRange) {
      if (!editor.validity.valid) value = '';
    } else {
      value = value.replace(/^#/, '');
      if (/^[a-f\d]{3}$/i.test(value)) value = [...value].map(c => c + c).join('');
      value = /^[a-f\d]{6}$/i.test(value) ? '#' + value : '';
    }
    if (!value) {
      editor.setAttribute('aria-describedby', error.id + ' exactEntryHint');
      const hint = isRange
        ? `Enter a whole number from ${input.min} to ${input.max}${unit && ' ' + unit}.`
        : 'Enter a 3- or 6-digit hex color.';
      if (leaving) {
        editor.removeAttribute('data-draft');
        editor.value = displayed();
        editor.removeAttribute('aria-invalid');
        error.textContent = hint + ' Previous value kept.';
      } else {
        editor.setAttribute('aria-invalid', 'true');
        error.textContent = hint;
      }
      return;
    }
    editor.removeAttribute('data-draft');
    clearError();
    input.value = value;
    input.dispatchEvent(new Event(isRange ? 'input' : 'change', { bubbles: true }));
  }
  editor.addEventListener('input', () => { editor.setAttribute('data-draft', ''); clearError(); });
  editor.addEventListener('blur', () => commit(true));
  editor.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      if (!editor.hasAttribute('data-draft')) editor.select();
    } else if (event.key === 'Escape' && (editor.hasAttribute('data-draft') || error.textContent)) {
      event.preventDefault();
      event.stopPropagation();
      refresh(true);
      editor.select();
    }
  });
  input.addEventListener('input', () => refresh(true));
  input.addEventListener('change', () => refresh(true));
  input.addEventListener('focus', clearError);
  return { refresh, commit };
}

export function initPopupView(elements, resolveFontCssValue) {
  const values = [...document.querySelectorAll('.setting-row input:is([type="color"], [type="range"])')]
    .map(initValueControl);
  const preview = document.getElementById('layoutPreview');
  const clocks = [...document.querySelectorAll('[data-clock-sample]')];
  const colorWithOpacity = (color, opacity) =>
    `color-mix(in srgb, ${elements[color].value} ${elements[opacity].value}%, transparent)`;

  initNavigation();

  function refreshView(resetDrafts = false) {
    for (const control of values) control.refresh(resetDrafts);

    const columns = elements.cardsPerRow.valueAsNumber;
    if (preview.childElementCount !== columns * 2) {
      const cards = Array.from({ length: columns * 2 }, () => {
        const card = document.createElement('div');
        card.className = 'mini-card';
        return card;
      });
      preview.replaceChildren(...cards);
    }
    preview.style.setProperty('--preview-columns', columns);
    const gap = Math.min(5, 22 / columns, 1 + elements.gridGap.valueAsNumber / 6);
    preview.style.setProperty('--preview-gap', gap + 'px');
    preview.style.setProperty('--preview-padding', (3 + elements.viewportPadding.valueAsNumber / 8) + 'px');
    preview.style.setProperty('--preview-bg', elements.pageBgColor.value);
    preview.style.setProperty('--preview-card', colorWithOpacity('cardBgColor', 'cardBgOpacity'));

    const clockFont = resolveFontCssValue(elements.globalFont.value);
    for (const clock of clocks) {
      const prefix = clock.dataset.clockSample + 'Clock';
      clock.style.color = colorWithOpacity(prefix + 'Color', prefix + 'Opacity');
      clock.style.backgroundColor = colorWithOpacity(prefix + 'BgColor', prefix + 'BgOpacity');
      clock.style.fontFamily = clockFont;
      clock.style.fontWeight = elements[prefix + 'Boldness'].value;
      clock.style.fontSize = (13 * elements.clockScale.valueAsNumber / 120) + 'px';
    }
  }

  return {
    refreshView,
    commitDrafts: () => values.forEach(control => control.commit(true))
  };
}
