---
title: "predicate-builder-nested-hash-arm-accepts-a-ruby-hash"
status: closed
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
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
closed-reason: "FALSIFIED: owner ruling 2026-10-09 on trails#8733 — a ported API accepts a plain JS object where Rails takes a Hash unless a Ruby-Hash-specific feature is needed, so PredicateBuilder keeps its plain-object arm and where.associated/missing converting index_with's result with Object.fromEntries is the intended shape."
---

## Context

`PredicateBuilder#expand_from_hash` takes its association arm on `value.is_a?(Hash)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder.rb`, `expand_from_hash`),
and `PredicateBuilder.references` and `#convert_dot_notation_to_hash` test the same thing.

trails' ports (`packages/activerecord/src/relation/predicate-builder.ts`, `expandFromHash`, `references`,
`convertDotNotationToHash`) test a module-private `isPlainObject(value)`, so a ruby-compat `Hash` (a `Map`
subclass) passed as a nested value is bound as a scalar: `where({ comments: indexWith(["id"], null) })`
renders `"comments"."id" = NULL` on the outer table instead of `"comments"."id" IS NULL`.

Seen on trails#8733: `WhereChain#associated` / `#missing`
(`packages/activerecord/src/relation/query-methods.ts`) build
`Array(reflection.association_primary_key).index_with(nil)` (`relation/query_methods.rb:95`, `:128`), and
activesupport's `indexWith` answers a `Hash`. They convert it with `Object.fromEntries(...)` before handing
it to `not` / `whereBang`, a call Rails does not make.

## Acceptance criteria

- [ ] `expandFromHash`, `references` and `convertDotNotationToHash` take their Hash arm for a `Map` /
      ruby-compat `Hash` value as well as a plain object, with a test for each.
- [ ] `WhereChain#associated` / `#missing` pass `indexWith(kernelArray(...), null)` straight through and the
      two `Object.fromEntries` calls are deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
