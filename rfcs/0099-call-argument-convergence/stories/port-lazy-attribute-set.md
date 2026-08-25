---
title: "port-lazy-attribute-set"
status: done
updated: 2026-08-16
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6585
claim: "2026-08-15T23:28:17Z"
assignee: "extract-call-template-build"
blocked-by: null
closed-reason: null
---

# Port LazyAttributeSet / LazyAttributeHash so `build_from_database` constructs what Rails constructs

## Context

Surfaced while converging RFC 0099's `kind: "args"` rows (PR for
`converge-constructor-argument-rows`). The row

    activemodel | attribute-set/builder.ts | build_from_database | new
    rubyArgs: [values, types, additionalTypes, defaultAttributes]

could not be converged and now carries a reviewed reason instead.

`vendor/rails/activemodel/lib/active_model/attribute_set/builder.rb:15-17`:

    def build_from_database(values = {}, additional_types = {})
      LazyAttributeSet.new(values, types, additional_types, default_attributes)
    end

`LazyAttributeSet` (builder.rb:21-) and `LazyAttributeHash` materialize each
`Attribute` only when it is first read, which is what makes loading a wide row
cheap. trails has neither class: `packages/activemodel/src/attribute-set/builder.ts:14-34`
walks every declared type eagerly and returns a plain `AttributeSet`.

That is a mechanism divergence, not an argument-list one — the argument row is
just where it surfaced.

## Acceptance criteria

- [ ] `LazyAttributeSet` and `LazyAttributeHash` are ported under their Rails
      names into `packages/activemodel/src/attribute-set/builder.ts`, mirroring
      Rails method for method.
- [ ] `buildFromDatabase` returns `new LazyAttributeSet(values, types, additionalTypes, defaultAttributes)`.
- [ ] The `build_from_database -> new` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activemodel/attribute-set/builder.json`
      (delete by hand; no `--write`, no reseed).
- [ ] `pnpm parity:api:calls:args` green; SQLite, PostgreSQL and MySQL/MariaDB
      lanes green.
