---
title: "converge-query-attribute-type-cast-to-rails-no-op"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into query-attribute-type-cast-is-a-no-op — duplicate story describing the same deviation; the surviving body carries both sets of Rails and trails file:line citations"
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/query_attribute.rb:22-24`
is:

```ruby
def type_cast(value)
  value
end
```

A `QueryAttribute` never routes its raw value through the type — `value` IS
`value_before_type_cast`, and `serializable?` / `unboundable?` / `infinite?`
all read the raw value.

trails' `packages/activerecord/src/relation/query-attribute.ts#typeCast` casts
instead (`return this.type.cast(value)`), a divergence already noted in the
`isUnboundable()` JSDoc in that file. PR #6528 hit it: once
`ActiveModel::Type::DateTime#cast_value` carries Rails' `else` arm (returning a
non-String receiver untouched instead of coercing it through `String(value)`),
a `StatementCache::Substitute` bind reaches a `normalizes` normalizer and
raises — Rails never gets there, because `type_cast` is a no-op. #6528 shipped
the narrow guard Rails' own constructor justifies (`query_attribute.rb:13-14`,
"we don't need to serialize StatementCache::Substitute"): `typeCast` returns a
`Substitute` unchanged. The general divergence stands.

Converging `typeCast` to Rails' no-op was measured on that branch: it makes
`normalized-attribute.test.ts` pass without the guard, and reds 3 tests in
`packages/activerecord/src/relation/query-attribute.test.ts` that assert the
casting behaviour (e.g. `new QueryAttribute("age", "25", intType).value` is
expected to be `25`, where Rails answers `"25"`). Those expectations need
checking against `vendor/rails/activerecord/test/cases/relation/` first — if
they are trails inventions they go; if they mirror a Rails test, the
`value` readers that depend on the cast are what has to move.

## Acceptance criteria

- [ ] `QueryAttribute#typeCast` is `return value`, matching
      `query_attribute.rb:22-24`, and the `Substitute` guard #6528 added is
      gone with it (it exists only because the cast does).
- [ ] Each red expectation in `relation/query-attribute.test.ts` is resolved
      against the Rails test it mirrors, not by re-adding a cast.
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` stay green; no new
      baseline rows.
