---
title: "activerecord: constraint name lookups read an undefined name kwarg as a present key"
status: in-progress
updated: 2026-10-08
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8687
claim: "2026-10-08T17:05:11Z"
assignee: "pg-gem-connection-surface-scores-against-the-pg-gem"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8487 review. A TS caller forwards an absent keyword as an `undefined`-valued
key, and ruby-compat's `hasKey` (`Object.hasOwn`) reads that key as present, so
`fetch(options, "name", block(...))`, the port of `options.fetch(:name) { ... }`, returns
`undefined` instead of running the block.

Three constraint-name bodies have that shape:

- `connection-adapters/postgresql/schema-statements.ts#exclusionConstraintName` and
  `#uniqueConstraintName`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:1078-1086,1098-1106`).
  trails#8487 covered their one writer path by making `exclusionConstraintOptions` /
  `uniqueConstraintOptions` (`:753-759,804-814`) dup with `compact({ ...options })`, an extra call
  Rails does not make (`options = options.dup`), receipted `@inventedArm compact — PERMANENT`.
  The lookup paths (`exclusionConstraintFor`, `uniqueConstraintFor`, `:1088-1111`) are not covered.
- `connection-adapters/abstract/schema-statements.ts#foreignKeyName` and `#checkConstraintName`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb`,
  `foreign_key_name` / `check_constraint_name`). Their writers, `foreignKeyOptions`
  (`if (!rtest(options.name)) options.name = this.foreignKeyName(...)`) and `checkConstraintOptions`
  (`dup.name ??= this.checkConstraintName(...)`), have no `compact`, so
  `addForeignKey(a, b, { name: undefined })` yields an `undefined` constraint name.

The converged shape is one decision for all four: either the kwargs-receiving side drops
`undefined`-valued keys in one settled idiom, or `hasKey` / `fetch` treat an `undefined` value as an
absent key (a JS `null` is Ruby's stored `nil`; `undefined` has no Ruby counterpart). With either,
the two `compact` receipts are deleted and the `*Options` bodies are `options = { ...options }`.

Secondary, same file: `exclusionConstraintForBang` renders `expression ?? symbolizeKeys(options)`
where Rails is `#{expression || options}` (`postgresql/schema_statements.rb:1093-1096`); they
differ for `expression: false`. `foreignKeyForBang` and `checkConstraintForBang` in the abstract
file use the same `??`.

## Acceptance criteria

- [ ] `{ name: undefined }` derives the hashed name through `addForeignKey`, `addCheckConstraint`,
      `addExclusionConstraint`, `addUniqueConstraint` and the four `*For` lookups, with a test each.
- [ ] `exclusionConstraintOptions` and `uniqueConstraintOptions` no longer call `compact`, and
      their `@inventedArm compact — PERMANENT` receipts are deleted.
- [ ] The three `*ForBang` messages take Ruby truthiness for the `||` operand.
