---
title: "parity: String.new(x) is the String(x) conversion call, not an omitted new"
status: claimed
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-03T02:55:22Z"
assignee: "call-gate-credits-argumentless-hash-new-as-a-literal"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-2` audit: the receipt below was
`PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`QueryMethods#does_not_support_reverse?` copies its argument into a plain `String` before reading it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:2044-2052`):

```ruby
def does_not_support_reverse?(order)
  # Account for String subclasses like Arel::Nodes::SqlLiteral that
  # override methods like #count.
  order = String.new(order) unless order.instance_of?(String)
```

`packages/activerecord/src/relation/query-methods.ts` `isDoesNotSupportReverse` writes
`const plain = String(order)`: the JS conversion call, which is what turns a `SqlLiteral` into a
primitive string. `new String(order)` would build a boxed `String` object, which is not a string
(`typeof` answers `"object"`), so the `new` Rails spells has no faithful `new` expression in JS. The
call-set gate reads `String.new` as an omitted `new`, and the body carries `@missingRailsCall new`.

`call-gate-credits-argumentless-hash-new-as-a-literal` is the same finding for `Hash.new` /
`Array.new` with no argument. `NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts`) is keyed by bare
name and cannot take `new`, which is every constructor call in the package.

The TS body also drops the `unless order.instance_of?(String)` guard and renames the local to
`plain`, where Rails reassigns `order`.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` / `compare.ts` credit a `String.new(x)` Ruby site as made by a TS `String(x)` conversion call (receiver constant `String` only, so no other `new` is silenced), with unit tests for the credited case and for a `Foo.new(x)` that must stay flagged.
- [ ] `isDoesNotSupportReverse` reassigns `order` under Rails' `instance_of?(String)` guard, and its `@missingRailsCall new` receipt is deleted.
- [ ] `pnpm parity:api:calls` green with no baseline row added; any other row that moves is listed in the PR body.

## Verification

```bash
pnpm vitest run scripts/api-compare && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
