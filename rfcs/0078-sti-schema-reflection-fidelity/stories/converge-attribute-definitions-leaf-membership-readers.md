---
title: "converge-attribute-definitions-leaf-membership-readers"
status: done
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6769
claim: "2026-08-21T10:10:23Z"
assignee: "converge-attribute-definitions-leaf-membership-readers"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-attribute-definitions-onto-default-attributes` (RFC 0078)
after taking the reader inventory: `_attributeDefinitions` has 132 non-test
references across 26 source files, so the umbrella story cannot land in one PR.

This story covers the **leaf membership readers** — call sites that only ask
"does this class own an attribute named X", where Rails asks `columns_hash[name]`
or `attribute_types`:

- `packages/activerecord/src/locking/optimistic.ts:133` — Rails
  `locking_enabled?` is `lock_optimistically && columns_hash[locking_column]`
  (`locking/optimistic.rb:160-162`).
- `packages/activerecord/src/dynamic-matchers.ts:32` — Rails `Method#valid?` is
  `attribute_names.all? { |name| model.columns_hash[name] || model.reflect_on_aggregation(...) }`
  (`dynamic_matchers.rb:57-59`).
- `packages/activerecord/src/relation/calculations.ts:1518`
  (`pluckCastTypeForKnownColumn`) — Rails reads
  `model.attribute_types.fetch(name) { ... }` (`calculations.rb:610-625`).
  NOTE: a naive swap to `attributeTypes()[name] == null` reds
  `calculations.test.ts` ("pluck not auto table name prefix if column
  joined/included", `[7n]` vs `[7]`) because trails' `attributeTypes()` answers
  for names the side map does not carry — this one needs the whole
  `type_cast_pluck_values` shape converged, not a membership swap.
- `packages/activerecord/src/translation.ts:30` — the ancestor walk sniffs for
  `_attributeDefinitions` on the parent constructor; Rails' `lookup_ancestors`
  is `ancestors.select { |x| x.respond_to?(:model_name) }`
  (`activemodel/lib/active_model/translation.rb:36-38`).

The first two landed with the ignored-columns story; the last two remain.

## Acceptance criteria

- [ ] `calculations.ts`'s `pluckCastTypeForKnownColumn` resolves through
      `attributeTypes()` in the Rails `type_cast_pluck_values` shape, with
      `calculations.test.ts` green on all three adapters.
- [ ] `translation.ts`'s `lookupAncestors` stops sniffing `_attributeDefinitions`.
- [ ] No new `_attributeDefinitions` reader is added.
