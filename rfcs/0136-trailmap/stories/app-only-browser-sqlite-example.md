---
title: "app-only-browser-sqlite-example"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
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

Once the playground moves into `packages/website` (`move-browser-sqlite-into-website-as-playground`), `examples/browser-sqlite` should be a plain trails app running in the browser on SQLite (sql.js), with no editor, console, problems pane or other tools. The runtime it needs (vfs, rack-bridge, expo-sqlite-sqljs, template compiler, shims) is owned by the website after the move; `runtime.html` and `src/runtime/main.ts` show the app-only boot path today.

## Acceptance criteria

- `examples/browser-sqlite` boots the blog template app in the page, importing the runtime from the website package.
- No editor, file tree, console, type-check or share/download UI.
- A smoke script/CI step loads the app and checks a page renders.
