---
title: "remove-usefixtures-public-surface"
status: done
updated: 2026-07-05
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4584
claim: "2026-07-05T01:00:47Z"
assignee: "remove-usefixtures-public-surface"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails
fidelity above all else.** Owner directive: tests should ALWAYS declare fixtures
through `fixtures({ ... })` — never call `useFixtures` directly. `fixtures()`
mirrors Rails' bare `fixtures :authors, :posts` declaration (no "handler"
qualifier) and defaults `schema: TEST_SCHEMA`, so it is the single endgame
surface. Retire `useFixtures` as a public/direct-call surface.

Architecture (verified): `fixtures()` (`test-helpers/fixtures.ts`) →
`useHandlerFixtures()` (`test-helpers/use-handler-fixtures.ts`, line ~94) →
`useFixtures()` (`test-helpers/use-fixtures.ts`). `useFixtures` is the engine,
but it is also called DIRECTLY by 6 test files:

- `adapter.test.ts`
- `adapters/postgresql/prepared-statements-disabled.test.ts`
- `delegate.test.ts`
- `view.test.ts`
- `test-helpers/naked-fixtures.test.ts`
- `test-helpers/use-fixtures.test.ts` (exercises `useFixtures` itself)

## Acceptance criteria

- Migrate the 6 direct `useFixtures` call sites onto `fixtures({ ... })` (drop
  the explicit `schema` arg where it is just `TEST_SCHEMA`; `fixtures` defaults
  it). Where a caller needs the tableless/connection options, pass them through
  `fixtures`' options bag (same `UseFixturesOpts` / `FixturesConnectionOpts`).
- Fold the `useFixtures` engine into `useHandlerFixtures` (or make `useFixtures`
  a non-exported internal of `use-handler-fixtures.ts`) so no `.test.ts` outside
  `test-helpers/` can call it. Rename/rework `use-fixtures.test.ts` to test the
  surviving surface without renaming Rails-matched test names.
- `git grep -l "useFixtures" packages/activerecord/src/**/*.test.ts` -> only
  test-helpers/ (if any), never a ported AR test.
- Coordinate ordering with `convert-use-fixtures-schema-off-defineschema` (both
  touch use-fixtures.ts) — ship whichever lands first, rebase the other.
- `test:compare` delta >= 0; no test renames. NO node:_/process._; async fs only.
