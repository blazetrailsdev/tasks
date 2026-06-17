---
title: "Kanban example: scaffold SvelteKit app + AR bootstrap"
status: draft
updated: 2026-06-17
rfc: "0034-sveltekit-kanban-example"
cluster: examples
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 1 of the SvelteKit Kanban example (RFC 0034-sveltekit-kanban-example,
finalized). Scaffold the SvelteKit app at `examples/sveltekit-kanban/` with the
server-side AR bootstrap. Mirror `examples/twitter-clone/src/db.ts`'s
`connect()` + `loadModelSchemas()` idempotent pattern, run once from
`src/hooks.server.ts`. Adapter is `better-sqlite3` for parity.

## Acceptance criteria

- [ ] `examples/sveltekit-kanban/` scaffolded (package.json, svelte.config.js,
      vite.config.ts, tsconfig.json) with no new third-party runtime deps
      beyond SvelteKit + better-sqlite3.
- [ ] `config/database.ts` keyed on `TRAILS_ENV` (dev file DB, test in-memory).
- [ ] `src/lib/server/db.ts` exposes idempotent `boot()` (establishConnection +
      registerModel + loadSchema); `src/hooks.server.ts` calls it once.
- [ ] No AR import reaches a `.svelte` or universal `+page.ts` module.
