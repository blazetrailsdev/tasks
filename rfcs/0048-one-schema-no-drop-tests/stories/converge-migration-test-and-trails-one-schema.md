---
title: "converge-migration-test-and-trails-one-schema"
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

Follow-up to `converge-migration-tests-one-schema` (RFC 0048). That story named
three files; PR #4328 faithfully ported `invertible-migration.test.ts` (the one
file that fits a single all-or-nothing PR under the 500-LOC ceiling). The
remaining two files are deferred here because each must convert all-or-nothing
in its own PR:

- `packages/activerecord/src/migration.test.ts` (~1852 lines) → mirror
  `vendor/rails/activerecord/test/cases/migration_test.rb` (~69 KB). Far larger
  than 500 LOC; will itself need splitting by sub-cluster across PRs.
- `packages/activerecord/src/migration.trails.test.ts` → trails-only extension;
  keep as-is unless a case duplicates a Rails test (do NOT invent a Rails
  source). Audit and either justify or fold each case.

Follow the RFC 0048 Convergence contract: port the Rails test file (names +
assertions word-for-word), ride canonical schema + Rails' own scratch tables
(`testings`, etc.), fix the impl or file `0023-surfaced-deviations` for any
surfaced gap, all-or-nothing per file.

## Acceptance criteria

- [ ] `migration.test.ts` mirrors `migration_test.rb` faithfully (split by
      sub-cluster across PRs under 500 LOC each; each file/cluster all-or-nothing).
- [ ] `migration.trails.test.ts` audited: every case either has no Rails
      counterpart (kept, justified) or is converged/removed.
- [ ] test:compare delta non-negative; api:compare unaffected by test-only edits.
