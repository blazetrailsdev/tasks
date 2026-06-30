---
title: "converge-base-attribute-methods-one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
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

Follow-up to `converge-core-attribute-methods-one-schema` (RFC 0048). That story's
PR converged the small "core" cluster — `packages/activerecord/src/core.test.ts` and
`packages/activerecord/src/core.trails.test.ts` — onto the canonical `topics` table
(official `Topic` model, `author` → `author_name`, `defineSchema({ topics:
canonicalSchema.topics }, { dropExisting: true })`). The remaining three files in the
original story were left for a separate PR because together they exceed the 500-LOC
ceiling and need heavier per-test rework:

- `packages/activerecord/src/base.test.ts` (~2253 LOC) — heavy user of a bespoke
  `users.name` column, plus other invented columns.
- `packages/activerecord/src/attribute-methods.test.ts` (~1300 LOC) — bespoke
  `topics`/`items`/etc. shapes and inline `attribute()`-declared models.
- `packages/activerecord/src/attribute-methods.trails.test.ts` (~172 LOC) — bespoke
  `items` table (name/count/code) used by the readonly-attribute test; the other
  cases use inline `class X extends Base` models that never hit the DB (the
  attribute-method generation machinery), so only the `items` table needs a
  canonical home.

These are all parked in `eslint/one-schema-exclude.json` (on the pr4246 branch) and
are the classic RFC 0019 burndown surface.

## Acceptance criteria

- Convert each file to canonical `TEST_SCHEMA` tables/columns + official
  fixtures/models; no bespoke tables, no invented columns. Match Rails
  table/column names exactly. Test names stay verbatim.
- Each file passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Remove each converged file from `eslint/one-schema-exclude.json` as it lands
  (and its `eslint/require-canonical-schema-exclude.json` entry if present).
- Split across PRs under the 500-LOC ceiling as needed (base.test.ts likely needs
  its own PR or sub-clustering); one file or sub-cluster per PR is fine.
