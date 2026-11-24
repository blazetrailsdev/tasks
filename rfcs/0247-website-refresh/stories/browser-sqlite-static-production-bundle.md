---
title: "browser-sqlite builds to a static bundle (Rollup TDZ, eager lazy import, i18n self-import)"
status: done
updated: 2026-11-24
rfc: "0247-website-refresh"
cluster: website-deploy
packages: ["activerecord", "sqlite3", "i18n"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#10683
claim: "2026-11-23T23:49:45Z"
assignee: "browser-sqlite-static-production-bundle"
blocked-by: null
closed-reason: null
---

## Context

`examples/browser-sqlite` (trails#10630) runs a trails app in a browser tab, but only on the Vite dev server. A `vite build` of it fails at run time in three ways, recorded in the example's README ("What a browser needs that Node does not", last row):

- **Merged chunks:** Rollup reorders trails' import cycles, so a `class Sub extends Super` evaluates with `Super` still in TDZ ("Cannot access 'X' before initialization"). See CLAUDE.md, "Call-time constant resolution". The cycles are safe under native ESM entry order, but not under Rollup's chunk order.
- **Eager evaluation:** a module that is imported lazily (`import()` of native `better-sqlite3` in `packages/sqlite3`) is hoisted into an eager chunk and evaluated at load.
- **`preserveModules`:** a module's self-namespace import (`import * as I18n from "./index.js"` in `packages/i18n`) is dropped, so `I18n` is undefined.

## Acceptance criteria

- `vite build` of `examples/browser-sqlite` produces a static bundle that boots the app, migrates and serves `/preview/` in Chromium (`pnpm smoke <preview-url>` against `vite preview`).
- Each fix is in the framework package that causes it, not a Rollup workaround in the example: the cycle broken or seated per CLAUDE.md's sanctioned shapes, the lazy import kept lazy, and the self-import removed.
- The example README's "not handled" row is removed.
