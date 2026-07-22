---
title: "persistence-insert-returning-gate"
status: ready
updated: 2026-07-22
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
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

`test:compare --gates` (2026-07-22): persistence.test.ts:2147 "model with no
auto populated fields still returns primary key after insert" is
[missing-gate]: rails `adapters=[mysql,postgresql] features=[insert_returning]`
(class-level in vendor/rails/activerecord/test/cases/persistence_test.rb), ts
`guards=[unknown]` — the trails guard construct isn't recognized by the gate
extractor (`scripts/test-compare/gates.ts` classifyGateMismatch), so it
extracts as unknown.

Replace the unrecognized guard with the canonical
`describeIf*`/`itIfSupports` form expressing
`mysql,postgresql|insert_returning`.

## Acceptance criteria

- [ ] The test's extracted ts gate equals the rails gate; no [missing-gate]
      row for it in `test:compare --gates`.
- [ ] Test name/body unchanged apart from the gate wrapper.
