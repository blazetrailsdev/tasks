---
title: "Delete redundant setupFixtures() calls that sit beside a fixtures() call"
status: done
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: 4590
claim: "2026-07-05T02:37:27Z"
assignee: "converge-setupfixtures-redundant-next-to-fixtures"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). The zero-risk quick win, no lint
ratchet — a straight migration. Some AR test files call `setupFixtures()` on the
same file as a `fixtures([...])` / `fixtures({...})` call. But `fixtures()`
(`test-helpers/fixtures.ts:64` -> `useHandlerFixtures` ->
`use-handler-fixtures.ts`) ALREADY calls `setupHandlerSuite()` internally, so the
standalone `setupFixtures()` (= `setupHandlerSuite()`, `fixtures.ts:91`) line is
dead double-wiring. Example: `adapters/abstract-mysql-adapter/mysql-explain.test.ts`
imports `{ fixtures, setupFixtures }`, calls `setupFixtures()` at :14 and
`fixtures([...])` at :28 — the :14 line is removable with zero behavior change.

Find them:
`git grep -l 'setupFixtures' packages/activerecord/src/**/*.test.ts` intersected
with files that also call `fixtures(` (exclude test-helpers/). Delete the
redundant `setupFixtures()` call + its now-unused import.

## Acceptance criteria

- Every file that calls both `setupFixtures()` and `fixtures(...)` drops the
  redundant `setupFixtures()` call and unused import.
- No behavior change: fixtures() still wires the handler suite; tests green.
- Split by cluster/dir if >500 LOC. No test renames.
