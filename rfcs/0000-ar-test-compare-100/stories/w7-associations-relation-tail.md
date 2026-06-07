---
title: "W7 — associations + relation tail (audit-gated)"
status: ready
updated: 2026-06-07
rfc: "0000-ar-test-compare-100"
cluster: integrated
deps: ["w7-named-inner-joins-fix"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~265 association skips + ~170 relation skips. All infra deps (7.1–7.5) satisfied
on `main`. Each campaign: `/audit-report` → sized ≤250-LOC batches → un-skip.

Ordered by yield: eager (60) → join-model (36) → has-one (27) → relation-scoping
(20) → cascaded-eager (18) → habtm (14) → where (12) → has-one-through (11) →
autosave (11) → select (10) → strict-loading (7) → inverse (7) → + 11 more.

## Acceptance criteria

- [ ] Each campaign prefaced by a `/audit-report` sizing its slots.
- [ ] Each sub-PR ≤500 LOC off `main` (non-overlapping sibling branches).
- [ ] All association + relation skips → 0.

## Notes

Relation still-blocked (deferred to §Deferred): `eager_load` toSql+STI (3);
`missing`-with-enum (5 → I-2); parameterized join R6c (2, design gap).
`has_one` batch 2 blocked on `removeTargetBang` + async writer design.
