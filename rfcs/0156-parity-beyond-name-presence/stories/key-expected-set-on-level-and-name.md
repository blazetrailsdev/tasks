---
title: "Stop collapsing class-level and instance-level Ruby methods into one expected row"
status: in-progress
updated: 2026-09-21
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps:
  - "report-own-row-denominator-ratio"
deps-rfc: []
est-loc: 220
priority: null
pr: trails#7936
claim: "2026-09-21T18:16:00Z"
assignee: "key-expected-set-on-level-and-name"
blocked-by: null
closed-reason: null
---

## Context

`dedupeRubyMethodInto` keys the per-file expected set on the Ruby method NAME alone (`scripts/api-compare/compare.ts:2922-2933`; the doc at `:2768-2770` says "deduped by method name"). A class method and an instance method of one name in one file are therefore one row, and either TS member satisfies it. 127 activerecord definitions and 46 activesupport definitions collapse across the class/instance line.

Worked case: `ActiveRecord::AttributeMethods::ClassMethods#attribute_method?` (`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:224-226`) is unported, per 0155's `activerecord-class-level-attribute-method-predicate-strips-equals-suffix` and `port-class-side-attribute-method-and-allocate`. `parity:api` scores `attribute_methods.rb` 84/84 because the file also ports an instance `isAttributeMethod` (`packages/activerecord/src/attribute-methods.ts:470`).

## Acceptance criteria

- The expected set is keyed on (level, name), where level is class or instance, and a TS static satisfies only a class-level row.
- `attribute_methods.rb`'s class-level `attribute_method?` is reported missing.
- A `ClassMethods` fold and an `extend self` module still score once, with a test for each.
- The PR body lists every newly missing row per package. New rows are a burndown and are not baselined away.
