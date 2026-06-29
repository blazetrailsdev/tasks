---
title: "delete-orphaned-adapter-barrel"
status: ready
updated: 2026-06-29
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `repoint-adapter-barrel-imports-then-delete` (PR #4295), which
repointed every import off the `packages/activerecord/src/adapter.ts`
re-export barrel and rewired `index.ts` to forward the public
`DatabaseAdapter` alias from `connection-adapters/abstract-adapter.js`. As of
that PR, `adapter.ts` is **fully orphaned** — `git grep -lE 'from
"(\.{1,3}/)+adapter\.js"' -- 'packages/*/src/*'` returns nothing.

`adapter.ts` (~470 LOC: the retired `DatabaseAdapter` interface plus
re-export forwards that already live at their real homes) was left in place
in PR #4295 only to keep that PR under the LOC danger zone. This story is the
pure mechanical deletion, kept as a separate non-overlapping PR from main.

## Acceptance criteria

- [ ] `packages/activerecord/src/adapter.ts` (and its `adapter.test.ts` if it
      only exercises the barrel — verify first) deleted.
- [ ] `git grep -n 'adapter\.ts\|/adapter\.js' -- 'packages/*/src/*'` returns
      zero non-incidental hits (abstract-adapter.js etc. are fine).
- [ ] `pnpm exec tsc -b packages/activerecord` AND `pnpm exec tsc -b
  packages/trailties` at 0 errors.
- [ ] Branch from main (PR #4295 must be merged first so the file is truly
      unreferenced); NOT stacked.
