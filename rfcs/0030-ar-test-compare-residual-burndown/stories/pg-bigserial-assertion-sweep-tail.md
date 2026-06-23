---
title: "Converge BigInt PK assertions: long-tail 10 files (flip prereq)"
status: ready
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Prerequisite for `pg-bigserial-createtable-dumper-flip` (#3966, RFC 0030). See
sibling sweep story for root cause (int8→BigInt on default-PK flip). CI run
28040851821 surfaced this long tail (1–3 sites per file).

Failing assertion sites (verbatim line numbers from the flip CI run):

- `packages/activerecord/src/primary-keys.test.ts`: 66,71,123
- `packages/activerecord/src/persistence.test.ts`: 682,1103,1807
- `packages/activerecord/src/nested-attributes.test.ts`: 669,687,1024
- `packages/activerecord/src/calculations.test.ts`: 7534,7539
- `packages/activerecord/src/adapter.test.ts`: 598
- `packages/activerecord/src/view.test.ts`: 118
- `packages/activerecord/src/json-serialization.test.ts`: 312
- `packages/activerecord/src/insert-all.test.ts`: 619
- `packages/activerecord/src/base.test.ts`: 2140
- `packages/activerecord/src/attribute-methods.test.ts`: 1790

Converge each to expect `BigInt` where the value originates from a default-PK
column; verify against the Rails test. Note primary-keys.test.ts also has a
`schema dump primary key with serial/integer` un-skip owned by the flip story
itself — do not touch that one here.

## Acceptance criteria

- [ ] Every listed assertion is green on the PG lane WITH the bigserial flip
      applied locally.
- [ ] Green on all three lanes. Test names verbatim. Do NOT touch the deserializer.
