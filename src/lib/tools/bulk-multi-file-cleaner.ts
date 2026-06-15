/**
 * Bulk / Multi-File Cleaner - pure client-side batch engine.
 *
 * Design goals (see docs/tools/bulk-multi-file-cleaner.md):
 *  - Run the SAME de-AI cleaning engine (src/lib/cleaner.ts) over many files at
 *    once, so a folder of `.txt` / `.md` drafts gets the exact behaviour of the
 *    single-paste tool, file by file.
 *  - Produce a legible per-file report (status + counts) plus an aggregate
 *    summary, so the batch outcome is glance-able.
 *  - 100% in-browser, deterministic. Nothing here touches the DOM, the network,
 *    or the FileReader API - the island feeds in already-read text strings and
 *    metadata; this module only transforms data structures.
 *
 * MVP scope (Phase 1): plain-text and Markdown. `.docx` / ZIP repacking is a
 * known Phase-2 feature that needs JSZip/PizZip; we deliberately do NOT import
 * those uninstalled packages. The island feature-detects unsupported types and
 * marks them "coming soon" / "skipped" using the helpers below.
 *
 * Mirrors the pure-function, well-commented pattern of src/lib/cleaner.ts.
 */

import { clean, DEFAULT_OPTIONS, type CleanOptions, type CleanResult } from '../cleaner';

// Re-export the shared option types so the island can import everything from
// one place and stay in lock-step with the main cleaner.
export type { CleanOptions, CleanResult } from '../cleaner';
export { DEFAULT_OPTIONS } from '../cleaner';

/** File extensions whose text we clean directly as a string. */
export const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'text', 'mdx'] as const;

/**
 * Extensions we recognise but cannot process without an extra (uninstalled)
 * library. These are surfaced to the user as "coming soon" rather than silently
 * dropped, per the spec's "skipped-file transparency" rule.
 */
export const COMING_SOON_EXTENSIONS = ['docx', 'zip'] as const;

/** Per-file outcome status. Each value pairs with a distinct icon + label in the
 *  UI so state is never conveyed by colour alone (WCAG 1.4.1). */
export type FileStatus = 'cleaned' | 'unchanged' | 'skipped' | 'coming-soon' | 'error';

/** A file staged for cleaning, as handed in by the island after FileReader. */
export interface InputFile {
  /** Original filename, e.g. "chapter-01.md". */
  name: string;
  /** File size in bytes (for guardrails + display). */
  size: number;
  /** The file's text content. Empty string is allowed (→ "unchanged"). */
  text: string;
}

/** The result of cleaning one file. */
export interface FileReport {
  /** Original filename. */
  name: string;
  /** Suggested output filename (original stem + suffix + extension). */
  outName: string;
  /** Outcome status. */
  status: FileStatus;
  /** Cleaned text (only meaningful for 'cleaned' / 'unchanged'). */
  text: string;
  /** Per-artifact counts from the engine (zeroed for non-text outcomes). */
  counts: CleanResult['counts'];
  /** Human-readable reason for skipped / coming-soon / error rows. */
  reason?: string;
  /** Original byte size, echoed for display. */
  size: number;
}

/** Aggregate roll-up across a whole batch. */
export interface BatchSummary {
  /** Total files handed in. */
  total: number;
  /** Files that were actually changed. */
  cleaned: number;
  /** Files processed but already clean. */
  unchanged: number;
  /** Files skipped (unsupported / empty / oversized). */
  skipped: number;
  /** Files recognised but needing a Phase-2 library (docx/zip). */
  comingSoon: number;
  /** Files that errored. */
  errored: number;
  /** Sum of every artifact removed/normalized across the batch. */
  totalChanges: number;
  /** Per-artifact totals, for the "Removed N invisibles + M em dashes" strip. */
  counts: CleanResult['counts'];
}

/** A blank counts object, used for non-text outcomes and as a roll-up seed. */
function emptyCounts(): CleanResult['counts'] {
  return {
    emDashes: 0, enDashes: 0, smartQuotes: 0, ellipses: 0,
    invisibles: 0, nbsp: 0, markdown: 0, total: 0,
  };
}

/** Lowercased extension (without the dot) of a filename, or '' if none. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** The filename stem (everything before the final extension). */
function stemOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? name : name.slice(0, dot);
}

/** True for extensions we can clean as plain text right now. */
export function isTextExtension(ext: string): boolean {
  return (TEXT_EXTENSIONS as readonly string[]).includes(ext);
}

/** True for extensions we recognise but defer to a future Phase-2 build. */
export function isComingSoonExtension(ext: string): boolean {
  return (COMING_SOON_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Build the output filename for a cleaned file. We keep the original extension
 * and insert a suffix before it (default "-clean"), so "post.md" → "post-clean.md".
 * An empty suffix returns the original name unchanged (overwrite-style naming).
 */
export function outputName(name: string, suffix = '-clean'): string {
  const ext = extensionOf(name);
  const stem = stemOf(name);
  if (!suffix) return name;
  return ext ? `${stem}${suffix}.${ext}` : `${stem}${suffix}`;
}

/** Options governing how the batch is processed (cleaning opts + guardrails). */
export interface BatchOptions {
  /** The shared cleaning options applied to every file. */
  clean: CleanOptions;
  /** Filename suffix for outputs (default "-clean"; "" = keep originals). */
  suffix?: string;
  /** Per-file size cap in bytes; larger files are skipped. Default 5 MB. */
  maxBytes?: number;
}

export const DEFAULT_BATCH_OPTIONS: BatchOptions = {
  clean: DEFAULT_OPTIONS,
  suffix: '-clean',
  maxBytes: 5 * 1024 * 1024,
};

/**
 * Clean a SINGLE staged file. Pure: given the same input + options it always
 * returns the same report. Decides the outcome status from the file's extension,
 * size, content, and the engine's change count.
 */
export function cleanFile(file: InputFile, opts: BatchOptions = DEFAULT_BATCH_OPTIONS): FileReport {
  const suffix = opts.suffix ?? '-clean';
  const maxBytes = opts.maxBytes ?? DEFAULT_BATCH_OPTIONS.maxBytes!;
  const ext = extensionOf(file.name);
  const base: Omit<FileReport, 'status' | 'text' | 'counts'> = {
    name: file.name,
    outName: outputName(file.name, suffix),
    size: file.size,
  };

  // --- Guardrails first (friendly, specific reasons). ----------------------
  if (file.size > maxBytes) {
    return {
      ...base, status: 'skipped', text: '', counts: emptyCounts(),
      reason: `Too large (${formatBytes(file.size)} > ${formatBytes(maxBytes)} limit)`,
    };
  }

  // Recognised-but-deferred binary formats (docx, zip). We never try to parse
  // these here - that needs a library we have not bundled.
  if (isComingSoonExtension(ext)) {
    return {
      ...base, status: 'coming-soon', text: '', counts: emptyCounts(),
      reason: `.${ext} support is coming soon`,
    };
  }

  // Anything that isn't a known text type is skipped, not silently dropped.
  if (!isTextExtension(ext)) {
    return {
      ...base, status: 'skipped', text: '', counts: emptyCounts(),
      reason: ext ? `Unsupported type (.${ext})` : 'Unsupported type',
    };
  }

  // Empty file → nothing to do, but report it (not an error).
  if (file.text.length === 0) {
    return {
      ...base, status: 'unchanged', text: '', counts: emptyCounts(),
      reason: 'Empty file',
    };
  }

  // --- The real work: identical engine, identical options. -----------------
  try {
    const { text, counts } = clean(file.text, opts.clean);
    const changed = counts.total > 0 || text !== file.text;
    return {
      ...base,
      status: changed ? 'cleaned' : 'unchanged',
      text,
      counts,
    };
  } catch (err) {
    return {
      ...base, status: 'error', text: '', counts: emptyCounts(),
      reason: err instanceof Error ? err.message : 'Could not process file',
    };
  }
}

/** Clean a whole batch and return the per-file reports in input order. */
export function cleanBatch(files: InputFile[], opts: BatchOptions = DEFAULT_BATCH_OPTIONS): FileReport[] {
  return files.map((f) => cleanFile(f, opts));
}

/** Roll a list of per-file reports up into one aggregate summary. */
export function summarize(reports: FileReport[]): BatchSummary {
  const counts = emptyCounts();
  const s: BatchSummary = {
    total: reports.length,
    cleaned: 0, unchanged: 0, skipped: 0, comingSoon: 0, errored: 0,
    totalChanges: 0,
    counts,
  };
  for (const r of reports) {
    switch (r.status) {
      case 'cleaned': s.cleaned++; break;
      case 'unchanged': s.unchanged++; break;
      case 'skipped': s.skipped++; break;
      case 'coming-soon': s.comingSoon++; break;
      case 'error': s.errored++; break;
    }
    counts.emDashes += r.counts.emDashes;
    counts.enDashes += r.counts.enDashes;
    counts.smartQuotes += r.counts.smartQuotes;
    counts.ellipses += r.counts.ellipses;
    counts.invisibles += r.counts.invisibles;
    counts.nbsp += r.counts.nbsp;
    counts.markdown += r.counts.markdown;
  }
  counts.total =
    counts.emDashes + counts.enDashes + counts.smartQuotes + counts.ellipses +
    counts.invisibles + counts.nbsp + counts.markdown;
  s.totalChanges = counts.total;
  return s;
}

/** A short label + icon for a status, so the UI never relies on colour alone. */
export function statusMeta(status: FileStatus): { icon: string; label: string } {
  switch (status) {
    case 'cleaned': return { icon: '✓', label: 'Cleaned' };       // check
    case 'unchanged': return { icon: '-', label: 'Already clean' }; // em dash
    case 'skipped': return { icon: '⊘', label: 'Skipped' };        // circled slash
    case 'coming-soon': return { icon: '⏳', label: 'Coming soon' }; // hourglass
    case 'error': return { icon: '⚠', label: 'Error' };            // warning
  }
}

/** Human-friendly byte size (1024-based). Deterministic, no locale surprises. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

/**
 * Build a plain-text / CSV-style report users can copy or download to show a
 * client exactly what was normalized. One header row + one row per file.
 */
export function reportToCsv(reports: FileReport[]): string {
  const head = ['file', 'status', 'changes', 'em_dashes', 'en_dashes', 'smart_quotes', 'ellipses', 'invisibles', 'nbsp', 'markdown', 'note'];
  const rows = reports.map((r) => {
    const c = r.counts;
    return [
      r.name,
      statusMeta(r.status).label,
      String(c.total),
      String(c.emDashes), String(c.enDashes), String(c.smartQuotes), String(c.ellipses),
      String(c.invisibles), String(c.nbsp), String(c.markdown),
      r.reason ?? '',
    ].map(csvCell).join(',');
  });
  return [head.join(','), ...rows].join('\r\n');
}

/** Quote a CSV cell if it contains a comma, quote, or newline. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
