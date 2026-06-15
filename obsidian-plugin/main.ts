/**
 * Em Dash Remover — Obsidian plugin (MVP scaffold).
 *
 * MVP, per spec Section 4:
 *   - Clean-on-paste interception (editor-paste event).
 *   - "Clean selection" command.
 *
 * Advanced features (toast/undo, status bar, presets, per-rule settings tab,
 * AI-tell scan, per-folder rules, preview mode, bypass paste, ribbon toggle)
 * are marked TODO below. The cleaning logic lives in ./cleaner.ts and is the
 * shared, DOM-free engine ported from the website.
 *
 * Types come from the `obsidian` package at build time (esbuild + tsconfig);
 * not vendored here to keep the scaffold dependency-light.
 */

import {
  Plugin,
  Notice,
  Editor,
  MarkdownView,
  type MarkdownFileInfo,
  // htmlToMarkdown is an exported Obsidian API (Turndown-backed). Version-gate it.
  htmlToMarkdown,
} from 'obsidian';

import { clean, DEFAULT_OPTIONS, type CleanCounts, type CleanOptions } from './cleaner';

interface EmDashRemoverSettings {
  cleanOnPaste: boolean;
  rules: CleanOptions;
}

const DEFAULT_SETTINGS: EmDashRemoverSettings = {
  cleanOnPaste: true,
  rules: DEFAULT_OPTIONS,
};

export default class EmDashRemoverPlugin extends Plugin {
  settings: EmDashRemoverSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // --- Clean-on-paste interception (MVP) ---------------------------------
    this.registerEvent(
      this.app.workspace.on(
        'editor-paste',
        (evt: ClipboardEvent, editor: Editor, _info: MarkdownView | MarkdownFileInfo) => {
          // Defer to other paste plugins, and respect the master toggle.
          if (evt.defaultPrevented || !this.settings.cleanOnPaste) return;

          // Prefer HTML (convert to Markdown) so headings/lists/links survive;
          // fall back to plain text. Bail on non-text payloads (images, etc.).
          const html = evt.clipboardData?.getData('text/html');
          const raw = html
            ? safeHtmlToMarkdown(html)
            : evt.clipboardData?.getData('text/plain') ?? '';
          if (!raw) return;

          const { text, counts } = clean(raw, this.settings.rules);

          // No-op: do NOT preventDefault — let Obsidian handle the native paste.
          if (text === raw) return;

          evt.preventDefault();
          editor.replaceSelection(text);
          this.report(counts);

          // TODO: cache `raw` and offer a one-click "Undo this clean" in the toast.
          // TODO: skip Obsidian-internal (vault-to-vault) pastes.
          // TODO: for very large pastes (>100KB), run async and show "Cleaning…".
        },
      ),
    );

    // --- "Clean selection" command (MVP) -----------------------------------
    this.addCommand({
      id: 'clean-selection',
      name: 'Clean selection',
      editorCallback: (editor: Editor) => {
        const sel = editor.getSelection();
        if (!sel) {
          new Notice('Em Dash Remover: nothing selected.');
          return;
        }
        const { text, counts } = clean(sel, this.settings.rules);
        editor.replaceSelection(text);
        this.report(counts);
      },
    });

    // TODO: "Clean whole note" command (editor.getValue() → clean → replace).
    // TODO: "Bypass paste" command (Ctrl/Cmd+Shift+V inserts original verbatim).
    // TODO: "Scan note for AI tells" command + side-panel report.
    // TODO: editor-menu (right-click) entry "Clean selection with Em Dash Remover".
    // TODO: ribbon icon to toggle cleanOnPaste; status-bar live counter.
    // TODO: PluginSettingTab with presets + per-rule toggles and live examples.
  }

  /** Brief, dismissible toast summarizing what was cleaned. */
  private report(counts: CleanCounts): void {
    if (counts.total === 0) return;
    const parts: string[] = [];
    if (counts.emDashes) parts.push(`${counts.emDashes} em dash${counts.emDashes > 1 ? 'es' : ''}`);
    if (counts.enDashes) parts.push(`${counts.enDashes} en dash${counts.enDashes > 1 ? 'es' : ''}`);
    if (counts.smartQuotes) parts.push(`${counts.smartQuotes} curly quote${counts.smartQuotes > 1 ? 's' : ''}`);
    if (counts.ellipses) parts.push(`${counts.ellipses} ellipsis`);
    if (counts.invisibles) parts.push(`${counts.invisibles} invisible char${counts.invisibles > 1 ? 's' : ''}`);
    if (counts.nbsp) parts.push(`${counts.nbsp} nbsp`);
    new Notice(`Kept your voice. Cleaned: ${parts.join(', ')}.`);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

/** Version-gate htmlToMarkdown so the plugin degrades gracefully on old apps. */
function safeHtmlToMarkdown(html: string): string {
  try {
    if (typeof htmlToMarkdown === 'function') return htmlToMarkdown(html);
  } catch {
    /* fall through */
  }
  // Crude fallback: strip tags. The real engine handles the prose either way.
  return html.replace(/<[^>]+>/g, '');
}
