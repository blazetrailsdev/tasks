---
title: "playground-editor-is-monaco"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
est-loc: 350
packages:
  - website
deps:
  - move-browser-sqlite-into-website-as-playground
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The playground editor is custom: a `<textarea id="editor">` over a Shiki-highlighted `#highlight` div with a `#gutter` (`examples/browser-sqlite/index.html:80-92`), driven by `src/host/editing.ts`, `find.ts`, `highlight.ts` (`shiki` 2.5.0) and `main.ts`. Diagnostics come from `type-check.ts` / `type-check.worker.ts` into `#problems`. The website previously used Monaco (trails#377), removed with the Frontiers sandbox in trails#10325.

## Acceptance criteria

- The playground editor is Monaco; `editing.ts`, `find.ts`, `highlight.ts` and the textarea/gutter/highlight markup are deleted, and `shiki` is dropped if nothing else uses it.
- Type-check problems surface as Monaco markers (the `#problems` list may stay).
- File switching, persistence (`storage.ts`) and keyboard escape from the editor keep working; playground smoke passes.
