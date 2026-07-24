---
title: "resolve-skipped-composite-fk-nullify-regression-guard"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5246. `packages/activerecord/src/associations/has-many-associations.test.ts`
carries a permanently-skipped trails-invented regression guard,
`it.skip("depends and nullify with composite foreign key nulls every FK column")`
(around :1016). It was written against bespoke `CpkAuthor`/`CpkPost` classes
whose tables and columns (`tenant_id`, `author_id` integers on `cpk_posts`) do
not exist in the canonical schema — the canonical `cpk_posts`
(`test-helpers/test-schema.ts`) has a `(title, author)` composite PK instead.
PR #5246 de-collided the class names to
`NullifyCompositeAuthor`/`NullifyCompositePost` so they stop shadowing the
canonical `Cpk::Author`/`Cpk::Post`, but the test is still skipped and still
rides invented tables.

The behaviour it guards is real: before
`ForeignAssociation.nullifiedOwnerAttributes`, `dependent: :nullify` with an
array `foreignKey` only nulled the first FK column.

## Acceptance criteria

- Decide the test's fate and act: either re-express it on canonical CPK models
  - tables so it can be un-skipped, or delete it if the behaviour is already
    covered by a canonical `dependent: :nullify` composite-key test.
- If re-expressed, it must un-skip and pass; no invented tables or columns.
- Do NOT rename the test if it is kept.
