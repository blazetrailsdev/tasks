---
title: "scripts/tsconfig program: 284 AR declare-model / Arel type errors"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: ["scripts-tsconfig-program-has-384-type-errors"]
deps-rfc: []
est-loc: null
priority: null
pr: 5741
claim: "2026-07-31T18:44:56Z"
assignee: "scripts-tsconfig-ar-declare-model-type-errors"
blocked-by: null
closed-reason: null
---

## Context

`scripts/tsconfig.json` (added by `scripts-tree-has-no-typed-lint-coverage`,
PR #5713) creates a `noEmit` program over `scripts/**`. The sibling story
`scripts-tsconfig-program-has-384-type-errors` cleared every file-local error in
that program — 39 of them, across `api-compare`, `test-compare`, `test-deps`,
`schema-compare`, `tasks`, and `parity/schema` — leaving exactly **284**, all in
two buckets that share no fix with the rest and were deliberately deferred:

Reproduce with `npx tsc --build tsconfig.json && npx tsc -p scripts/tsconfig.json`
(the `--build` first: without it ~60 of the diagnostics are TS6305
"output file has not been built from source", which are stale-`dist` artifacts,
not real errors).

### Bucket A — `scripts/sync-stats/sync.ts`, 262 errors

- 3 × TS2307: `@blazetrails/activerecord`,
  `@blazetrails/activerecord/connection-adapters/sqlite3-adapter.js` and
  `.../better-sqlite3-adapter.js` do not resolve from `scripts/sync-stats/`.
  The scripts project uses `moduleResolution: "Bundler"` and the repo root is
  not a workspace package, so pnpm's `node_modules` link for the AR package is
  not on the resolution path from `scripts/`. Everything imported from AR is
  therefore `any` — fix this first, the other counts will move.
- 227 × TS2339: AR model statics missing on `typeof PullRequest` etc. —
  `tableName`, `primaryKey`, `attribute`, `where`, `findBySql`, `upsertAll`,
  `create`. These are materialized by the tse-compiler from the `declare`
  machinery; plain `tsc` does not run it, so a `class PullRequest extends Base`
  has none of them. This is "make `declare` models type-check under plain
  `tsc`", not a sync-stats fix — the same question the tse-compiler answers for
  package sources.
- 29 × TS7006 implicit-`any` params and 3 × TS7022 self-referential
  initializers, most of which are downstream of the two above.

### Bucket B — `scripts/parity/fixtures/*/query.ts`, 22 errors

A different root cause from bucket A despite the story that filed them
lumping the two together. These are Arel-shaped call-site mismatches, not
`declare`-model statics:

- 18 × TS2769 — `Model.where(<Arel node>)`, e.g.
  `Book.where(Book.arelTable.get("id").in(subquery))` in `ar-102/query.ts:4`.
  None of `where`'s four overloads accepts an Arel node; Rails' `where` does.
- 2 × TS2345 — `SelectManager` passed where `NodeOrValue` is expected
  (`arel-53/query.ts:10`, `arel-54/query.ts:9`).
- 1 × TS2345 — a `string` passed where `string[]` is expected
  (`ar-37/query.ts:3`).
- 1 × TS2339 — `Node#as` missing (`ar-157/query.ts:4`).

Each fixture is a Ruby/TS twin pair whose whole job is to stay shaped like the
Ruby it mirrors (they are `ignores`d by `eslint.config.mjs` for that reason), so
the fix belongs in the AR/Arel signatures, not in the fixture.

## Acceptance criteria

- Bucket A's TS2307 module resolution from `scripts/` is diagnosed and fixed (or
  the program is scoped so the question doesn't arise), and the remaining
  `declare`-model statics are addressed with the tse-compiler angle spelled out.
  Do NOT paper over either with `as any`.
- Bucket B's four Arel/where signature gaps are either fixed in the AR/Arel
  types or each annotated with a named reason. Do not edit the fixtures to dodge
  the type — they mirror their Ruby twins.
- `npx tsc -p scripts/tsconfig.json` reports zero errors after
  `npx tsc --build tsconfig.json`.
- Once the count is zero, reference `scripts/tsconfig.json` from the root
  `tsconfig.json` so `pnpm typecheck` keeps it there. Note `scripts/tsconfig.json`
  is `composite: true`, which is what a root reference needs.
