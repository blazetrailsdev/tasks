---
title: "createRange is a test-only adapter method Rails has no counterpart for"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`createRange` (`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`,
declared on the adapter interface at `postgresql-adapter.ts`) has **no Rails
counterpart** — `grep -rn "create_range" vendor/rails/activerecord/lib/` finds
nothing. It exists for the PG range-type tests
(`packages/activerecord/src/adapters/postgresql/range.test.ts`), which are its
only callers.

Rails creates those types in its test schema with raw SQL rather than an
adapter method
(`vendor/rails/activerecord/test/cases/adapters/postgresql/range_test.rb`
issues `CREATE TYPE ... AS RANGE` through `execute`), so trails has an adapter
method Rails does not, carrying a nested `quoteQualifiedIdentifier` helper and
two argument-validation raises that Rails has no site for.

Surfaced by PR #7539, which converged the file's error classes for
`pg-schema-statements-bare-error-throws-and-invented-guards`: its two
`new Error` throws became `ArgumentError`, which is the class Rails uses for
bad-argument input elsewhere in the same file
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:1039,1159`),
and the file left `eslint/rails-error-parity-exclude.json`. That fixed the
error _class_; it did not address the method being invented surface in the
first place. `createRange` is not currently flagged by
`parity:api:extra:gate` and carries no `@noRailsEquivalent` receipt, so this
is untracked.

## Converged shape

Delete `createRange` and its `quoteQualifiedIdentifier` helper, and have the
range tests issue `CREATE TYPE ... AS RANGE` through `execute` the way
`range_test.rb` does — moving the identifier quoting to the test's own literal
SQL, where Rails keeps it. If a caller outside tests turns up, the alternative
is a `@noRailsEquivalent` receipt naming it, but the test-only call graph
suggests deletion.

## Acceptance criteria

- [ ] `createRange` and `quoteQualifiedIdentifier` are gone from
      `postgresql/schema-statements.ts` and from the adapter interface in
      `postgresql-adapter.ts`.
- [ ] `adapters/postgresql/range.test.ts` creates its range types the way
      `range_test.rb` does, with test names unchanged.
- [ ] PostgreSQL lane green; `pnpm parity:api:extra --package activerecord`
      does not grow.
