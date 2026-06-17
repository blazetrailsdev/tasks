---
title: "Author RFC: SvelteKit example app (Kanban modeled on tasks/rfcs)"
status: ready
updated: 2026-06-17
rfc: "0003-activerecord-cli"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3542 added `packages/activerecord/README.md`, which now advertises a
**planned Vite example** (front-end / SPA integration). Today the only example
is `examples/twitter-clone/` (Express + better-sqlite3, server-side) — born from
RFC 0003 itself (#2638). New users arriving from a front-end background want to
see ActiveRecord in a modern full-stack framework.

Pivotal constraint: **ActiveRecord is server-side.** There is no browser/wasm
SQLite adapter — the adapters target Node (`sqlite3`/`better-sqlite3`/
`node-sqlite`, `pg`, `mysql2`) or React Native (`expo-sqlite`); see
`packages/activerecord/src/connection-adapters/`. So the example is a
**SvelteKit** app where AR runs inside SvelteKit's server context — `load`
functions, **form actions**, and `+server.ts` API routes — with a Svelte
front-end. SvelteKit is Vite-based, so this satisfies the "Vite example" intent
while keeping AR server-side. Form actions pair naturally with AR validations
(`fail(422, { errors })` ← `RecordInvalid` / `isValid()`); `load` functions pair
with queries + `includes` eager loading.

This story's deliverable is to **author an RFC** (via `pnpm tasks new-rfc`,
then `finalize`) proposing the SvelteKit example app — not to build the app.

## Recommended domain: a Kanban tracker modeled on tasks/rfcs

Dogfood the project's own structure. Map the trails tasks/RFC system onto the
board:

- **Board = RFC**, **List/column = status** (`draft` / `ready` / `in_progress`
  / `done` / `blocked`), **Card = story**.
- `Rfc` `hasMany` `stories`; `Story` `belongsTo` `rfc`, `belongsTo` `assignee`
  (a `User`).
- `enum` on `Story.status` (the columns) and an integer `priority` (lower =
  higher, mirroring `pnpm tasks priority`).
- **Self-referential `hasMany :through`** for story dependencies (the
  `set-deps` pattern) — a strong associations demo.
- Scopes: `ready`, `blocked`, `assignedTo(user)`, `byCluster`.
- Validations: `title` presence, `slug` uniqueness → rendered as SvelteKit
  form-action field errors.
- Transactions: claim a story / move a card across columns / reorder.

This exercises the widest AR slice (nested `includes`, enums, scopes,
validations→forms, transactions, self-join associations) while staying small,
and it visibly mirrors how the project itself is run.

## What the RFC must decide / cover

1. Architecture: SvelteKit server-side AR (load/actions/`+server.ts`); confirm
   adapter (`better-sqlite3` for parity with twitter-clone).
2. How `trails-tsc` typechecking coexists with Vite/SvelteKit's esbuild
   bundling — typecheck stays a **separate** step (`trails-tsc --schema
db/schema.ts --noEmit`), not wired into the dev/bundle path.
3. Model registration / connection bootstrap inside SvelteKit's lifecycle
   (where `establishConnection` + manifest import run server-side once).
4. Minimal directory layout mirroring `examples/twitter-clone`'s "exercises
   what you reach for first" framing; the Kanban domain above as the starting
   point.
5. A story breakdown for actually building the example (migrations, models,
   routes, UI), filed as follow-on stories.
6. Whether the example lives at `examples/sveltekit-kanban/` and joins the
   deferred `ci-examples-job` lane (RFC 0003 §Deferred).

## Acceptance criteria

- An RFC is authored in the tasks repo (draft `0000-` slug → `finalize` to a
  number) covering the decisions above, with the Kanban-on-tasks domain as the
  recommended starting point and the SvelteKit server-side architecture fixed.
- The RFC includes a concrete story breakdown for building the example.
- This story is closed when the RFC is written and finalized (authoring/spike —
  done-when-closed; a PR adding the RFC file is acceptable but optional).
