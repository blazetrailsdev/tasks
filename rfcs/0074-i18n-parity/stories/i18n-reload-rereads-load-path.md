---
title: "Make I18n.reload! re-read load_path from disk, not the preload cache"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6030
claim: "2026-08-03T21:56:08Z"
assignee: "i18n-reload-rereads-load-path"
blocked-by: null
closed-reason: null
---

## Context

`I18n.reload!` does not pick up an on-disk edit to a translation file, where
the gem's does.

In the gem, `Simple#reload!` clears `@initialized` and `@translations`
(`vendor/i18n/lib/i18n/backend/simple.rb:57-62`), so the next lazy call site
re-enters `init_translations` (`:83-86`), which calls `load_translations`
(`vendor/i18n/lib/i18n/backend/base.rb:15-20`) and **re-reads every file in
`I18n.load_path` from disk** via `YAML.load_file` / `JSON.load_file`
(`base.rb:246,262`).

PR #6021 made that whole chain synchronous so it could port verbatim, by
moving the async read up into `preloadTranslationFiles()`
(`packages/i18n/src/backend/base.ts`), which fills a module-level
`fileContents` Map. `loadYml` / `loadJson` then read from that Map. So after a
`reloadBang()`, the chain re-parses the _cached bytes_ rather than re-reading
the file — a `reload!` that misses an edit.

The deviation is cited at the seam in the `@noRailsEquivalent PERMANENT` block
on `preloadTranslationFiles`, and
`base.file-loading.trails.test.ts` covers the workaround ("re-reads
I18n.load_path when the preload is re-run before reloadBang").

## Converged shape

`I18n.reloadBang()` re-reads `I18n.load_path` from the host's `FileReader`, so
a file edited on disk is picked up without the caller re-running the preload.

The blocker is that `reload!` is synchronous in the gem and the read is a
Promise here. Candidate approaches, in rough order of preference:

1. Have `reloadBang` invalidate `fileContents` and re-run the preload, awaited
   by an async `I18n.reloadBang()` — this makes only `reload!` async, not the
   read path, so no lazy-init call site changes. Check what this costs the
   `reload!` callers first.
2. Let `registerFileReader` accept a reader that also exposes a cheap
   freshness check (mtime/etag), so the preload can be re-run by the host on a
   watcher rather than by `reload!`.

Do NOT converge this by making `lookup` / `translate` / `availableLocales`
async — that was measured on #6021 and rejected: 12 direct caller files across
five packages, all of them Rails-synchronous (`Error#message`, `Naming#human`,
`Inflector#ordinal`, `NumberConverter#format`, `HtmlSafeTranslation`).

## Acceptance criteria

- A translation file edited on disk is visible after `I18n.reloadBang()` with
  no second `preloadTranslationFiles()` call from the caller.
- The four lazy-init call sites in `simple.ts` stay synchronous and verbatim.
- The `@noRailsEquivalent` block on `preloadTranslationFiles` loses the
  "one behavioural consequence" paragraph, or the story is blocked with the
  specific language-level reason it cannot.
