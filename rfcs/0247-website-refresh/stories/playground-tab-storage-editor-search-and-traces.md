---
title: "Playground: per-tab storage, find in the editor, readable framework traces"
status: draft
updated: 2026-11-25
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Loose ends in the playground (`examples/browser-sqlite`) after trails#10753:

- **Shared storage across tabs.** Each tab now runs its own runtime, but files, the database and cookies are kept under fixed `localStorage` keys (`src/host/main.ts`, `FILES_KEY`, `DB_KEY`, `COOKIES_KEY`), so two tabs overwrite each other and the last write wins. Neither tab is told.
- **No search in the editor.** The editor is a transparent textarea over a Shiki backdrop (`src/host/highlight.ts`), so the browser's find highlights nothing visible. There is no find or replace.
- **Stack traces point into bundle chunks.** A debug page or console trace for framework frames reads `assets/constants.generated-*.js:133:3290`; app frames resolve because `transpile` emits inline source maps (`src/runtime/modules.ts`).
- **The database is base64 in `localStorage`.** trails#10753 warns once when storage is full; a larger database still stops being saved.

## Acceptance criteria

- A second tab either gets its own copy of the stored state or is told the app is open elsewhere; no silent overwrite.
- Find (and replace) inside the open file, by keyboard.
- Framework frames in a trace show a package and source file (source maps shipped or a readable chunk name), or the trace hides them behind "Framework Trace" by default as Rails' debug page does.
- The database is stored somewhere without `localStorage`'s quota (IndexedDB or OPFS), with existing saved databases migrated or discarded knowingly.
