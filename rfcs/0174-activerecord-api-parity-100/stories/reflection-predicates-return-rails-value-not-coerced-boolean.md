---
title: "activerecord: reflection predicates return the value Rails answers, not a coerced boolean"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the invented arms in `packages/activerecord/src/reflection.ts` (trails#8527). Three reflection predicates answer a coerced boolean where Rails answers the value its `||` / `&&` chain evaluates to:

- `AbstractReflection#hasCachedCounter` wraps Rails' expression in `!!( … )`. Rails: `options[:counter_cache] || inverse_which_updates_counter_cache && inverse_which_updates_counter_cache.options[:counter_cache] && active_record.has_attribute?(counter_cache_column)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:304-308`), which answers the counter-cache option hash.
- `AssociationReflection#validInverseReflection` wraps `reflection && reflection != self && …` in `!!( … )` (`reflection.rb:772-778`).
- `AssociationReflection#scopeAllowsAutomaticInverseOf` coerces `reflection.klass.automatic_scope_inversing` with `!!` (`reflection.rb:800-806`).

`validInverseReflection` also spells Ruby's `klass <= reflection.active_record` (`reflection.rb:776`) inline as `this.klass === x || this.klass.prototype instanceof x`; ruby-compat has no `Module#<=`.

## Converged shape

Each method returns the expression itself, typed as the value it answers, with callers that need a boolean testing it. `klass <=` goes through a ruby-compat port of `rb_class_inherited_p` (`Module#<=`) if one is added for another caller; otherwise the inline form stays.

## Acceptance criteria

- [ ] `hasCachedCounter`, `validInverseReflection` and `scopeAllowsAutomaticInverseOf` carry no `!!` coercion and their return types name the value Rails answers.
- [ ] `pnpm parity:api:predicates` and `pnpm parity:api:returns` stay green.
