---
title: "activerecord-tests-drop-maybe-promises"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
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

`blazetrails/no-floating-maybe-promise` (added by `promise-gate-counts-maybe-promise-returns`, trails#10098) is the fourth rule in `scripts/parity/promise-count.ts` `RULES`. It reports a dropped call whose type has a thenable union member (`PromiseLike<T> | T`), which `no-floating-promises` skips. `activerecord-tests-drop-no-promises` (trails#10162) cleared activerecord's `floating` and `swallowed` test sites and did not touch this rule. Its activerecord mark is 67, and the PR #10162 reviewer counted about 40 of those in tests, for example:

- `packages/activerecord/test/cases/relation/or.test.ts:225-231`
- `packages/activerecord/test/cases/relation/load-async.test.ts:52,204`
- `packages/activerecord/test/cases/finder.test.ts:1236`
- `packages/activerecord/test/cases/relations.test.ts:526,596`

## Acceptance criteria

- [ ] No `blazetrails/no-floating-maybe-promise` finding is left in `packages/activerecord/test/**`. Each one is awaited or returned, or the test checks the synchronous arm on purpose with an assertion on the value it returns.
- [ ] No test changes what it asserts. Each awaited value that now rejects is a real failure, and it is fixed or filed.
- [ ] `pnpm parity:promises:tighten` lowers activerecord's `no-floating-maybe-promise` mark.
