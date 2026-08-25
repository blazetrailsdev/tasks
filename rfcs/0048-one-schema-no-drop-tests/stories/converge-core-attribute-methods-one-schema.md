---
title: "Converge base/core/attribute-methods tests to canonical (one-schema)"
status: done
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: ["0019-canonical-schema-burndown"]
est-loc: 500
pr: 4316
claim: "2026-06-30T12:40:42Z"
assignee: "converge-core-attribute-methods-one-schema"
blocked-by: null
---

## Context

PR #4246 parked these files in `eslint/one-schema-exclude.json` because they declare
bespoke tables/columns the canonical `TEST_SCHEMA` (and Rails `schema.rb`) lack — the
classic RFC 0019 burndown surface (e.g. a `users.name` column, `posts.subtitle`,
`topics.score`, bespoke `tasks`/`people`). One-schema mode (no per-test DROP) needs every
data-layer test on canonical tables. Heavy users of a bespoke users.name column.

## Acceptance criteria

- Convert each file to canonical `TEST_SCHEMA` tables/columns + official fixtures/models;
  no bespoke tables, no invented columns. Match Rails table/column names exactly.
- Each file passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Remove each converged file from `eslint/one-schema-exclude.json` as it lands
  (and its grandfathered entry in `eslint/require-canonical-schema-exclude.json` if present).
- Split across PRs under the 500-LOC ceiling as needed; one file or sub-cluster per PR is fine.

### Files

- `packages/activerecord/src/base.test.ts`
- `packages/activerecord/src/core.test.ts`
- `packages/activerecord/src/core.trails.test.ts`
- `packages/activerecord/src/attribute-methods.test.ts`
- `packages/activerecord/src/attribute-methods.trails.test.ts`
