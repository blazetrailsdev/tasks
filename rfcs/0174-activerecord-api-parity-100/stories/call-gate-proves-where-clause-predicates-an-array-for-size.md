---
title: "parity: the call gate proves WhereClause#predicates an Array for size"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-2` audit: the receipt below was
`PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`WhereClause#invert` branches on `predicates.size == 1`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/where_clause.rb:85-93`).
`packages/activerecord/src/relation/where-clause.ts` `invert` reads `this.predicates.length === 1`
under `@missingRailsCall size`. `.length` is the JS spelling of `Array#size` and is a property, not
a call, so the call-set gate charges the body with an omitted `size`.

`scripts/api-compare/compare.ts`'s `significantCallsForReceivers` already drops a
`POSITIONAL_ARRAY_ANALOGUES` name (`first` / `last` / `any?` / `size` / `empty?`) for one Ruby body
when the receiver-kind data proves every site of it an `array`. It cannot prove this one:
`predicates` is an `attr_reader` (`where_clause.rb:117`) over `@predicates = predicates`, a
constructor parameter (`where_clause.rb:10-12`).

Every `WhereClause.new` site in the gem passes an Array:

| Site                                  | Argument                                                       |
| ------------------------------------- | -------------------------------------------------------------- |
| `where_clause.rb:15`                  | `predicates + other.predicates`                                |
| `where_clause.rb:19`                  | `predicates - other.predicates`                                |
| `where_clause.rb:23,29`               | `predicates \| other.predicates`                               |
| `where_clause.rb:33`                  | `except_predicates(columns)`                                   |
| `where_clause.rb:92`                  | `inverted_predicates`, an Array literal on both arms           |
| `where_clause.rb:96`                  | `new([])`                                                      |
| `relation/query_methods.rb:1589,1652` | `predicates` / `parts`, each built by `Array#map` or a literal |

`call-gate-proves-array-literal-ivars-and-kernel-array-receivers` is the neighbouring story: it
widens the proof to an ivar whose every assignment is an Array literal. This one is the
constructor-parameter case that story leaves out.

A danger case must stay flagged: an ivar a Relation or association can be passed into (`@records`,
`@target`) is not provably an Array, so the proof has to rest on the construction sites or on
Array-only operators applied to the reader in the class body (`+`, `-`, `|` against another
`predicates`), not on the name.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` records receiver kind `array` for `predicates` in `WhereClause`, by a proof that does not also fire for an ivar a non-Array is assigned to, with unit tests for both.
- [ ] The `@missingRailsCall size` receipt on `WhereClause#invert` is deleted and `pnpm parity:api:calls` is green with no baseline row added.
- [ ] Any other row the proof moves is listed in the PR body.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
