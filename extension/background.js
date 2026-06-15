/**
 * MV3 service worker.
 * - Registers the right-click "Clean selection" context menu (selection context).
 * - Routes the context-menu click and the keyboard command to the active tab's
 *   content script, which owns the DOM and does the in-place replacement.
 * - Owns no DOM and makes zero network requests.
 */

const MENU_ID = 'emdash-clean-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Clean selection (Em Dash Remover)',
    contexts: ['selection'],
  });

  // TODO: open a one-screen onboarding card on first install (popup or tab).
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab && tab.id != null) {
    sendToTab(tab.id, { type: 'EMDASH_CLEAN_SELECTION' });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'clean-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id != null) {
        sendToTab(tab.id, { type: 'EMDASH_CLEAN_SELECTION' });
      }
    });
  }
});

/**
 * Send a message to the content script in a tab. If the content script is not
 * present (e.g. it was injected on a page loaded before install), fall back to
 * injecting it on demand under activeTab, then retry.
 */
function sendToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting
        .executeScript({
          target: { tabId, allFrames: true },
          files: ['cleaner.js', 'content-script.js'],
        })
        .then(() => chrome.tabs.sendMessage(tabId, message))
        .catch(() => {
          /* Some pages (chrome://, web store) cannot be scripted — no-op. */
        });
    }
  });
}

// TODO: maintain the color-coded toolbar badge (green = active, grey = off)
// per-tab using chrome.action.setBadgeText / setBadgeBackgroundColor.
