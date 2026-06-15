/**
 * Content script — the only part that touches the page DOM.
 *
 * MVP modes:
 *  1. Right-click "Clean selection" (driven by a message from background.js).
 *  2. Clean-on-paste (off by default per-site; enabled from the popup).
 *
 * Replacement is undo-safe: plain fields use setRangeText, rich editors use an
 * insertText path so the framework's own transaction system records the change.
 *
 * The shared engine lives in cleaner.js (loaded before this script) and is
 * exposed as self.EmDashCleaner.
 */

(() => {
  const Cleaner = self.EmDashCleaner;
  if (!Cleaner) return; // engine failed to load; degrade silently.

  let options = { ...Cleaner.DEFAULT_OPTIONS };
  let cleanOnPasteEnabled = false;

  // ---- settings ------------------------------------------------------------

  chrome.storage.sync.get(['options', 'cleanOnPasteSites'], (data) => {
    if (data.options) options = { ...options, ...data.options };
    const sites = data.cleanOnPasteSites || {};
    cleanOnPasteEnabled = !!sites[location.host];
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.options) options = { ...Cleaner.DEFAULT_OPTIONS, ...changes.options.newValue };
    if (changes.cleanOnPasteSites) {
      const sites = changes.cleanOnPasteSites.newValue || {};
      cleanOnPasteEnabled = !!sites[location.host];
    }
  });

  // ---- messages from background.js ----------------------------------------

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'EMDASH_CLEAN_SELECTION') {
      const result = cleanActiveSelection();
      sendResponse({ ok: true, counts: result && result.counts });
    }
    return false;
  });

  // ---- clean-on-paste ------------------------------------------------------

  document.addEventListener(
    'paste',
    (e) => {
      if (!cleanOnPasteEnabled) return;
      const cd = e.clipboardData;
      if (!cd) return;
      const raw = cd.getData('text/plain');
      if (!raw) return;

      const { text, counts } = Cleaner.clean(raw, options);
      if (text === raw) return; // nothing to do; let the native paste happen.

      e.preventDefault();
      insertIntoActiveField(text);
      showToast(counts);
      // TODO: reuse the website's text/html Word/Docs cleanup for rich paste.
    },
    { capture: true }
  );

  // ---- selection cleaning --------------------------------------------------

  function cleanActiveSelection() {
    const el = document.activeElement;

    // Plain <input>/<textarea>: undo-safe setRangeText path.
    if (isTextInput(el)) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (start == null || end == null || start === end) return null;
      const selected = el.value.slice(start, end);
      const { text, counts } = Cleaner.clean(selected, options);
      if (text === selected) {
        showToast(counts);
        return { counts };
      }
      el.setRangeText(text, start, end, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      showToast(counts);
      return { counts };
    }

    // contenteditable / framework editors: insertText path.
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      const selected = sel.toString();
      const { text, counts } = Cleaner.clean(selected, options);
      if (text !== selected) insertIntoActiveField(text);
      showToast(counts);
      return { counts };
    }

    return null;
  }

  // ---- insertion helpers ---------------------------------------------------

  function isTextInput(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const t = (el.type || 'text').toLowerCase();
      // Skip non-text and sensitive inputs.
      return ['text', 'search', 'url', 'tel'].includes(t);
    }
    return false;
  }

  /**
   * Insert `text` at the current selection in a contenteditable / rich editor.
   * execCommand('insertText') is deprecated but remains the only reliable
   * cross-framework (ProseMirror/Lexical/Slate) path; fall back to a manual
   * range replacement + input dispatch where it is unavailable.
   */
  function insertIntoActiveField(text) {
    const el = document.activeElement;
    if (isTextInput(el)) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      el.setRangeText(text, start, end, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: text }));
      return;
    }

    if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
      return;
    }

    // Fallback: replace the range directly, then notify the editor.
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      sel.collapseToEnd();
      const target = el || document.body;
      target.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
    }
  }

  // ---- toast feedback ------------------------------------------------------

  function showToast(counts) {
    if (!counts) return;
    const total = counts.total || 0;
    const msg =
      total === 0
        ? 'Already clean ✓'
        : `Cleaned: ${describe(counts)}`;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      zIndex: '2147483647',
      bottom: '20px',
      right: '20px',
      maxWidth: '320px',
      padding: '10px 14px',
      borderRadius: '10px',
      font: '13px/1.4 system-ui, sans-serif',
      color: '#fff',
      background: '#15161a',
      boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
      // TODO: dark-mode-aware theming + prefers-reduced-motion + Undo link.
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function describe(c) {
    const parts = [];
    if (c.emDashes) parts.push(`${c.emDashes} em dash${c.emDashes > 1 ? 'es' : ''}`);
    if (c.enDashes) parts.push(`${c.enDashes} en dash${c.enDashes > 1 ? 'es' : ''}`);
    if (c.smartQuotes) parts.push(`${c.smartQuotes} smart quote${c.smartQuotes > 1 ? 's' : ''}`);
    if (c.ellipses) parts.push(`${c.ellipses} ellipsis`);
    if (c.invisibles) parts.push(`${c.invisibles} invisible char${c.invisibles > 1 ? 's' : ''}`);
    if (c.nbsp) parts.push(`${c.nbsp} nbsp`);
    return parts.join(', ') || `${c.total} fixes`;
  }

  // TODO (post-MVP):
  //  - Live-clean mode for AI chat (MutationObserver on assistant messages,
  //    debounced, loop-guarded with a data- processed flag).
  //  - Per-message "Clean this reply" button injection.
  //  - Highlight-only "audit this page" mode.
})();
