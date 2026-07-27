---
title: "lint-staged-rewrites-deprecated-methods-manifest"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 21
pr: 5430
claim: "2026-07-27T17:47:12Z"
assignee: "lint-staged-rewrites-deprecated-methods-manifest"
blocked-by: null
closed-reason: null
---

# lint-staged's eslint --fix silently rewrites rails-deprecated-methods.json

## Context

Surfaced on PR #5262. Committing any `*.ts` file makes lint-staged run
`eslint --fix` on just the staged paths, and that pass **regenerates
`eslint/rails-deprecated-methods.json` from only those paths** — every entry
for a file not in the commit is dropped.

Observed: a commit staging `scripts/ci-suite-coverage.test.ts` +
`vitest.config.ts` deleted the
`packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts`
entry (`unsignedFloat`, `unsignedDecimal`) and the
`packages/activesupport/src/core-ext/benchmark.ts` entry (`ms`). Rails still
deprecates both —
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_definitions.rb:50`
(`deprecate :unsigned_float, :unsigned_decimal`) and
`vendor/rails/activesupport/lib/active_support/core_ext/benchmark.rb:6-10`
(`ActiveSupport.deprecator.warn` in `Benchmark.ms`) — so the drop silently
removes `eslint/rails-deprecated-jsdoc.mjs` coverage for those methods: they
carry `@deprecated` JSDoc today, but nothing would flag its later removal.

It was caught only because a reviewer noticed an unrelated file in the diff.
Nothing in CI gates the manifest, so a truncation can merge unnoticed.

Related: [[lint-staged-format-eslint-mjs]] (0023, done).

## Acceptance criteria

- Either the manifest stops being written during a partial (staged-files-only)
  eslint run, or it is merged into rather than replacing the existing file.
- A CI check fails when `eslint/rails-deprecated-methods.json` is stale or has
  lost entries relative to a full-repo run (mirror how the conventions-doc
  drift check is wired in the `rails-comparison` job).
- Regression evidence: a commit staging a single unrelated `.ts` file leaves
  the manifest byte-identical.
