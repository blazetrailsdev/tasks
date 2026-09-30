---
title: "integer-type-range-ivar"
status: draft
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# ActiveModel::Type::Integer holds @range as a Range ivar

## Context

Rails' `ActiveModel::Type::Integer#initialize` stores the range as an ivar,
`@range = min_value...max_value`, read through `attr_reader :range` and tested
with `range.member?(value)` in `in_range?`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/integer.rb:52-55,78-82`).

trails' `IntegerType` (`packages/activemodel/src/type/integer.ts`) has no such
field: `range` is a getter returning a fresh `[min, max]` tuple, and
`isInRange` does the endpoint comparison inline. Because a dumped Rails type
carries `range: !ruby/range ...`, `rbDeclareIvar(IntegerType, "@range", "_range")`
(added with the psych ivar convergence) routes a loaded `@range` into a
`_range` field nothing reads, so the reader is not shadowed. A trails dump of
an `IntegerType` emits no `range:` key where Rails does.

## Acceptance criteria

- [ ] `IntegerType`'s constructor sets `_range` to ruby-compat `new Range(minValue, maxValue, true)`, and `range` reads it.
- [ ] `isInRange` is `value == null || range.isInclude(value)` (or the ruby-compat `member?` port), exact for `bigint` against the limit-8 endpoints.
- [ ] A dumped `IntegerType` carries `range:` as Rails' does; `yaml-serialization.test.ts`, `or.test.ts` and `integer*.test.ts` stay green on sqlite, PG and MariaDB.
