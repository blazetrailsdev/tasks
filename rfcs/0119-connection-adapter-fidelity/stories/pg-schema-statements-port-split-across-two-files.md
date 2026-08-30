---
title: "postgresql/schema_statements.rb is ported into two TS files, so twelve methods score moved"
status: in-progress
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 7247
claim: "2026-08-30T15:05:49Z"
assignee: "biginteger-castvalue-declares-number-but-returns-bigint"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7115 (RFC 0121, activerecord enrollment), where twelve names in one
file each needed a `@noRailsEquivalent` receipt whose reason is the same
sentence: "the port splits that file."

Rails keeps one file,
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`.
trails splits it into `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
plus `.../schema-statements-class.ts`, and `parity:api` maps only the first onto
the `.rb`. Every method that landed in the `-class` half therefore scores as
`moved` — present in Rails, credited to a file the port does not map onto —
even though each is a faithful port sitting one file away from where it belongs.

The twelve, with the Rails line each is a port of:

| TS name                       | Rails                                 |
| ----------------------------- | ------------------------------------- |
| `validateConstraint`          | `postgresql/schema_statements.rb:893` |
| `assertValidDeferrable`       | `:1031`                               |
| `extractForeignKeyAction`     | `:1023`                               |
| `extractConstraintDeferrable` | `:1037`                               |
| `exclusionConstraintName`     | `:1078`                               |
| `exclusionConstraintFor`      | `:1088`                               |
| `exclusionConstraintForBang`  | `:1093`                               |
| `uniqueConstraintName`        | `:1098`                               |
| `uniqueConstraintFor`         | `:1108`                               |
| `uniqueConstraintForBang`     | `:1113`                               |
| `sequenceNameFromParts`       | `:301` (`default_sequence_name`)      |

(`sequenceNameFromParts` is also a rename — it is the interpolation inside
`default_sequence_name`, not a Rails method of its own.)

CLAUDE.md is explicit that a method must stay in the file matching Rails' layout
or `parity:api` cannot credit it there, and RFC 0121 makes the cost visible: a
receipt written at the `-class` half is the only remedy the tooling accepts,
which is twelve rows of ledger standing in for one file move.

## Converged shape

One `schema-statements.ts` per Rails' one `schema_statements.rb`. Fold the
`-class` half back in — checking first why the split exists (a TS
class/mixin-shape constraint rather than a Rails one; `SchemaStatements` is
mixed into the adapter via `include()`), and if a genuine TS constraint forces
two modules, the second must not carry Rails-ported methods.

`sequenceNameFromParts` converges separately: inline it into
`defaultSequenceName` the way `schema_statements.rb:301` writes it, or keep it
only if a TS shortcoming actually requires the extraction.

## Acceptance criteria

- The twelve names above are credited against
  `postgresql/schema_statements.rb` by `pnpm parity:api`, and their
  `@noRailsEquivalent` receipts are DELETED rather than reworded.
- `pnpm parity:api:extra:gate` green with activerecord's marks moving DOWN.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `:calls:args` clean.
