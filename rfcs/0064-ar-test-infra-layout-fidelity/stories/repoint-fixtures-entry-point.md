---
title: "repoint-fixtures-entry-point"
status: done
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5518
claim: "2026-07-28T15:47:11Z"
assignee: "repoint-fixtures-entry-point"
blocked-by: null
closed-reason: null
---

## Context

`disposition-remaining-test-helpers` (PR pending) moved the fixture machinery
out of `packages/activerecord/src/test-helpers/` to the package root under its
Rails `lib/` names:

- `test-helpers/use-fixtures.ts` -> `src/test-fixtures.ts`
  (`activerecord/lib/active_record/test_fixtures.rb`)
- `test-helpers/define-fixtures.ts` + `fixture-set.ts` -> `src/fixtures.ts`
  (`activerecord/lib/active_record/fixtures.rb`)

One file was deliberately left behind: `test-helpers/fixtures.ts`, a six-line
re-export shim

```ts
export { fixtures } from "../test-fixtures.js";
```

kept only because **331 test files** import `fixtures()` through it. Repointing
them in the same PR would have added ~660 LOC of pure import churn on top of
the moves and blown well past the 500-LOC ceiling, so the shim stays until this
story lands.

## Acceptance criteria

- Every import of `test-helpers/fixtures.js` is repointed at `test-fixtures.js`
  (`./`, `../`, `../../` forms — 145 / 145 / 41 respectively as of the move).
- `packages/activerecord/src/test-helpers/fixtures.ts` is deleted.
- No other change rides along: this is a single mechanical rename, so note that
  in the PR body per CLAUDE.md's rename exception to the LOC ceiling.
- `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` pass.
- `pnpm parity:schema` / `pnpm parity:fixtures` output unchanged — both key
  off `test-helpers/fixtures/` and `test-helpers/test-schema.ts`, neither of
  which this story touches.
- Check `eslint/no-internal-canonical-loaders.mjs` + its test: they reference
  `"./test-helpers/fixtures.js"` as the allowlisted public entry point and must
  be updated to `"./test-fixtures.js"`.

## Notes

Depends on `disposition-remaining-test-helpers` being merged first — do not
stack; branch from `main` once it lands.
