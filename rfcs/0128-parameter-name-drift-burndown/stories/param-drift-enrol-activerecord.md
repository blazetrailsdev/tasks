---
title: "Enrol activerecord in the parameter-name gate once its six slices land"
status: draft
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - param-drift-activerecord-relation-and-scoping
  - param-drift-activerecord-abstract-adapters
  - param-drift-activerecord-concrete-adapters
  - param-drift-activerecord-base-and-attribute-methods
  - param-drift-activerecord-associations
  - param-drift-activerecord-remainder
  - param-drift-positional-misalignment-is-a-dropped-parameter
deps-rfc: []
est-loc: 30
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord` carries 302 of the 624 parameter-name rows, split six ways plus
the misalignment story so no PR exceeds the LOC ceiling. Enrolment is the step
that makes the burndown permanent — until the package is in `GATED_PACKAGES`,
nothing stops the next port from spelling a parameter its own way, which is
precisely how 302 rows accumulated behind a 100% arity figure.

It is a separate story because it can only run when every slice has landed:
enrolling early would red CI for work that is correctly still in flight, and
seeding a non-zero mark would turn the ratchet into a budget — the failure mode
RFC 0117's extra-surface mark and RFC 0121's enrollment set both warn about.

## Acceptance criteria

- `API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params` reports
  **0 rows** — the precondition; if it does not, the remaining rows are filed as
  a new story under this RFC rather than absorbed into the mark.
- `"activerecord"` added to `GATED_PACKAGES` in
  `scripts/api-compare/param-name-mark.ts`, mark seeded at
  `{ "total": 0, "byFile": {} }`, and `pnpm parity:api:params` reports it OK.
- `param-name-mark.test.ts`'s committed-mark case is extended to cover it.
