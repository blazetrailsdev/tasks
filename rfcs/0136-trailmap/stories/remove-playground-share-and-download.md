---
title: "remove-playground-share-and-download"
status: ready
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
est-loc: 120
packages:
  - website
deps:
  - move-browser-sqlite-into-website-as-playground
deps-rfc: []
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The playground has share-by-link and download-as-zip: `examples/browser-sqlite/src/host/share.ts` (`encodeChanges`/`decodeChanges`/`applyChanges`), `zip.ts`, the `#share` / `#download` handlers in `src/host/main.ts:589-603`, and the load-shared-link prompt at `main.ts:~840-851`.

## Acceptance criteria

- `share.ts`, `zip.ts`, the share/download buttons and handlers, and the shared-link load path are deleted.
- Playground smoke passes with no share/download steps.
