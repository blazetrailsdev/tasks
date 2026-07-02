---
title: "schema:compare — structural parity check of TEST_SCHEMA vs vendored schema.rb"
status: ready
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/test-helpers/test-schema.ts` (TEST_SCHEMA) is
documented (CLAUDE.md, PR #4438) as mirroring
`vendor/rails/activerecord/test/schema/schema.rb`, and the RFC 0019 burndown
plus the require-canonical-schema lint assume that mirror is faithful. But
nothing verifies it: a table/column added to TEST_SCHEMA that doesn't exist in
schema.rb (the encrypted_posts near-miss), or drift when vendor/rails is
bumped, is only caught by human review.

A structural comparator can parse schema.rb (Ruby-side extraction like
`scripts/api-compare/extract-ruby-api.rb`, or a targeted create_table parser)
and diff table names / column names / column types+options against TEST_SCHEMA,
reporting (a) entries in TEST_SCHEMA absent from schema.rb and (b) canonical
tables whose shape diverges. Mode (a) is the guard-rail; (b) can start as
report-only.

## Acceptance criteria

- `pnpm schema:compare` (name aligned with existing `*:compare` scripts) diffs
  TEST_SCHEMA against vendored schema.rb at table + column granularity.
- Invented tables/columns (in TEST_SCHEMA, not in schema.rb) fail the check;
  a small documented allowlist covers deliberate exceptions if any exist.
- Shape divergences on shared tables are reported (non-fatal initially).
- Wired into CI alongside the other parity gates.
