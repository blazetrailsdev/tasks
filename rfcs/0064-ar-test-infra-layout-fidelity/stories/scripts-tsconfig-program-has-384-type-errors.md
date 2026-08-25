---
title: "scripts-tsconfig-program-has-384-type-errors"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - scripts-tree-has-no-typed-lint-coverage
deps-rfc: []
est-loc: null
priority: null
pr: 5723
claim: "2026-07-31T16:56:52Z"
assignee: "scripts-tsconfig-program-has-384-type-errors"
blocked-by: null
closed-reason: null
---

## Context

PR for `scripts-tree-has-no-typed-lint-coverage` added `scripts/tsconfig.json`
(noEmit, root project references) so the ESLint project service can type-check
`scripts/**`. The program it creates reports **323 pre-existing type errors** (384 when this story was first filed;
PR #5713 then declared `tinyglobby` and pulled `vendor/*.ts` into the program,
which cleared 61 of them — the slug's 384 is stale, the file is the count),
deliberately deferred there: fixing them is far larger than one 500-LOC PR, and
none of them block lint (`pnpm lint` is green — type errors are not lint
results). Because the project is `noEmit` and is _not_ referenced from the root
`tsconfig.json`, `pnpm typecheck` / `tsc --build` does not see them either.

Reproduce with `npx tsc -p scripts/tsconfig.json`. Breakdown by file:

- `scripts/sync-stats/sync.ts` — 262 (68%). Almost all are AR model statics
  (`attribute`, `where`, `findBySql`, `upsertAll`, `create`) missing on
  `typeof PullRequest` etc. These models rely on the `declare` machinery that
  the tse-compiler materializes; plain `tsc` does not see those statics. Fixing
  this is really "make `declare` models type-check under plain tsc", not a
  sync-stats fix.
- `scripts/api-compare/build-freshness.ts` — 13, mostly
  `ts.UpToDateStatusType` (an internal TS API not in the public `.d.ts`).
- ~25 one-error `scripts/parity/fixtures/*/query.ts` files — same AR `declare`
  root cause as sync-stats.
- ~35 genuinely small ones spread over `api-compare/extract-ts-api.test.ts`
  (`info.fileFunctions` possibly undefined), `test-deps/build-fixture-baseline.ts`,
  `test-compare/{extract-ts-tests,assertion-kinds}.ts`,
  `tasks/cli.test.ts`, `schema-compare/compare.test.ts`, and
  `generate-standalone-associations-exclude.ts` (`parser.parseForESLint` arity).

## Acceptance criteria

- The ~35 small, file-local errors above are fixed (implicit `any` params,
  possibly-undefined narrowing, wrong arity), or each is annotated with a named
  reason.
- `ts.UpToDateStatusType` use in `build-freshness.ts` is either typed against a
  declared shim or documented as an internal-API dependency.
- The AR `declare`-model bucket (sync-stats + parity fixtures, ~290 errors) is
  either resolved or split out into its own story with the tse-compiler angle
  spelled out — do not paper over it with `as any`.
- Once the count reaches zero, consider referencing `scripts/tsconfig.json`
  from the root `tsconfig.json` so `pnpm typecheck` keeps it at zero.
