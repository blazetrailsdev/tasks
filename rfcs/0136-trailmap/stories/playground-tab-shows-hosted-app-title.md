---
title: "playground-tab-shows-hosted-app-title"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
est-loc: 80
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

The playground page title is fixed: `examples/browser-sqlite/index.html:6` (`<title>trails playground · a full-stack app in a browser tab</title>`). The hosted app renders in the preview (`runtime.html`, booted by `src/runtime/main.ts`, responses bridged through `src/runtime/rack-bridge.ts`), and its own `<title>` (from the app layout, e.g. `templates/blog`) never reaches the browser tab.

## Acceptance criteria

- When the preview loads or navigates, the browser tab title shows the hosted app's `<title>` (e.g. `<app title> · trails playground`), falling back to the current title when the app has none.
- The title updates on in-app navigation, not only on first load.
- Playground smoke asserts the tab title reflects the blog template's title.
