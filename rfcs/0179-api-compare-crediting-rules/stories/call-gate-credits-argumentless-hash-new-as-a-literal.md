---
title: "parity: an argument-less Hash.new / Array.new is a literal, not an omitted call"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8436
claim: "2026-10-03T02:55:22Z"
assignee: "call-gate-credits-argumentless-hash-new-as-a-literal"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ForeignAssociation#nullified_owner_attributes` builds its result with `Hash.new.tap`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/foreign_association.rb:13-18`):

```ruby
def nullified_owner_attributes
  Hash.new.tap do |attrs|
    Array(reflection.foreign_key).each { |foreign_key| attrs[foreign_key] = nil }
    attrs[reflection.type] = nil if reflection.type.present?
  end
end
```

An argument-less `Hash.new` is the literal `{}`, and that is what
`packages/activerecord/src/associations/foreign-association.ts` writes. A literal is not a call, so the
call-set gate charges the body with an omitted `new` and the port carries `@missingRailsCall new`.
`NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts`) is keyed by bare name and cannot take `new`,
which is every constructor call in the package.

The Ruby extractor already records a receiver per call site (`callReceivers`, RFC 0129). A site whose
receiver is the constant `Hash` (or `Array`) and whose argument list and block are empty has no JS
call form and can be dropped from significance for that body alone — the row-scoped mechanism
`significantCallsForReceivers` already applies to the five positional idioms.

The same receipt sits on `core.ts`, `encryption/configurable.ts`,
`encryption/auto-filtered-parameters.ts` and `tasks/mysql-database-tasks.ts`; check each against the
same rule rather than assuming it.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` / `compare.ts` do not count an argument-less, block-less `Hash.new` / `Array.new` as a significant call, with a comparator unit test for both the dropped case and `Hash.new(0)` / `Hash.new { }` / `Foo.new` staying significant.
- [ ] `foreign-association.ts`'s `@missingRailsCall new` is deleted (the gate reds a receipt that suppresses nothing).
- [ ] Any other `@missingRailsCall new` receipt the rule covers is deleted in the same PR.

## Verification

```bash
pnpm vitest run scripts/api-compare/compare.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:receipts:gate
```
