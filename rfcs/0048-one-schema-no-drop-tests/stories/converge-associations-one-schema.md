---
title: "Converge association tests to canonical (one-schema)"
status: in-progress
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: ["0019-canonical-schema-burndown"]
est-loc: 500
priority: 6
pr: 4312
claim: "2026-06-30T10:54:30Z"
assignee: "converge-associations-one-schema"
blocked-by: null
---

## Context

PR #4246 parked these files in `eslint/one-schema-exclude.json` because they declare
bespoke tables/columns the canonical `TEST_SCHEMA` (and Rails `schema.rb`) lack — the
classic RFC 0019 burndown surface (e.g. a `users.name` column, `posts.subtitle`,
`topics.score`, bespoke `tasks`/`people`). One-schema mode (no per-test DROP) needs every
data-layer test on canonical tables. Association suites are large — expect multiple PRs.

## Acceptance criteria

- Convert each file to canonical `TEST_SCHEMA` tables/columns + official fixtures/models;
  no bespoke tables, no invented columns. Match Rails table/column names exactly.
- Each file passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Remove each converged file from `eslint/one-schema-exclude.json` as it lands
  (and its grandfathered entry in `eslint/require-canonical-schema-exclude.json` if present).
- Split across PRs under the 500-LOC ceiling as needed; one file or sub-cluster per PR is fine.

### Files

- `packages/activerecord/src/associations/eager-singularization.test.ts`
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`
- `packages/activerecord/src/associations/has-one-through-associations.test.ts`
- `packages/activerecord/src/associations/inner-join-association.test.ts`
