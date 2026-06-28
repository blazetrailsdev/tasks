---
title: "Converge one-schema-excluded data-layer files to canonical"
status: ready
updated: 2026-06-28
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: ["0019-canonical-schema-burndown"]
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4246 added `AR_ONE_SCHEMA=1` no-drop test mode and seeded
`eslint/one-schema-exclude.json` with ~54 files that can't yet run under it.
Two classes:

1. DDL/infra-machinery tests that legitimately need bespoke schemas (migration\*,
   migrator, schema-dumper, schema-introspection, adapter tests, define-schema
   /use-fixtures/with-transactional-fixtures, multiple-db, test-databases) —
   these are expected permanent exclusions.
2. Pre-canonical DATA-LAYER tests that invent bespoke tables/columns the
   canonical TEST*SCHEMA (and Rails schema.rb) lack — e.g. `users.name`,
   `posts.subtitle`, `encrypted_posts`, `topics.score`, bespoke `tasks`/`people`.
   These are RFC 0019 convergence work (base, core, finder, autosave, enum,
   validations, associations/*, nested-attributes, query-cache\_, encryption*,
   attribute-methods*, instrumentation, transaction-instrumentation).

## Acceptance criteria

- Convert the class-2 data-layer files to canonical TEST_SCHEMA tables/columns +
  fixtures (per-file or small clusters, ≤500 LOC each), removing each from
  `eslint/one-schema-exclude.json` as it converges.
- Each converged file passes under `AR_ONE_SCHEMA=1` on all three backends.
- Track class-1 infra exclusions separately as accepted permanent exclusions
  (no convergence expected).
