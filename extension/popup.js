/**
 * Popup controller. Reads/writes settings in chrome.storage.sync so the content
 * script and other devices stay in sync. No network access.
 */

const RULE_KEYS = ['enDashes', 'smartQuotes', 'ellipsis', 'invisibles', 'whitespace', 'markdown'];

const PRESETS = {
  smart: { dashStyle: 'smart', enDashes: true, smartQuotes: true, ellipsis: true, invisibles: true, whitespace: true, markdown: false },
  plain: { dashStyle: 'comma', enDashes: true, smartQuotes: true, ellipsis: true, invisibles: true, whitespace: true, markdown: true },
  publish: { dashStyle: 'smart', enDashes: false, smartQuotes: false, ellipsis: false, invisibles: true, whitespace: true, markdown: false },
};

const DEFAULT_OPTIONS = { ...PRESETS.smart };

let currentHost = '';

init();

async function init() {
  const tab = await getActiveTab();
  try {
    currentHost = tab && tab.url ? new URL(tab.url).host : '';
  } catch (_e) {
    currentHost = '';
  }

  const data = await chrome.storage.sync.get(['options', 'preset', 'cleanOnPasteSites', 'sessionCount']);
  const options = { ...DEFAULT_OPTIONS, ...(data.options || {}) };

  document.getElementById('preset').value = data.preset || 'smart';
  RULE_KEYS.forEach((k) => {
    document.getElementById(k).checked = !!options[k];
  });

  const sites = data.cleanOnPasteSites || {};
  document.getElementById('cleanOnPaste').checked = !!sites[currentHost];

  document.getElementById('counter').textContent = `${data.sessionCount || 0} fixes this session`;

  // Wire up events.
  document.getElementById('preset').addEventListener('change', onPreset);
  RULE_KEYS.forEach((k) => document.getElementById(k).addEventListener('change', onRuleChange));
  document.getElementById('cleanOnPaste').addEventListener('change', onCleanOnPaste);

  // TODO: point this at the live site origin and prefill the current selection.
  document.getElementById('openFull').href = 'https://emdashremover.com/';
}

async function onPreset(e) {
  const preset = e.target.value;
  const options = { ...PRESETS[preset] };
  RULE_KEYS.forEach((k) => {
    document.getElementById(k).checked = !!options[k];
  });
  await chrome.storage.sync.set({ preset, options });
}

async function onRuleChange() {
  const data = await chrome.storage.sync.get('options');
  const options = { ...DEFAULT_OPTIONS, ...(data.options || {}) };
  RULE_KEYS.forEach((k) => {
    options[k] = document.getElementById(k).checked;
  });
  await chrome.storage.sync.set({ options });
}

async function onCleanOnPaste(e) {
  const data = await chrome.storage.sync.get('cleanOnPasteSites');
  const sites = data.cleanOnPasteSites || {};
  if (e.target.checked) sites[currentHost] = true;
  else delete sites[currentHost];
  await chrome.storage.sync.set({ cleanOnPasteSites: sites });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
  });
}
