---
title: "Widen writeFromUser to the Rails one-liner once the schema cache is warm at construction"
status: ready
updated: 2026-06-23
rfc: "0031-schema-cache-always-warm-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3960 (story `writefromuser-strict-unknown-name-fallthrough`) converged the
strict unknown-attribute raise, but only at the AR public-write layer and only
when the schema cache is warm. The literal Rails one-liner remains deferred
because trails does not yet seed the attribute set with every schema column at
construction (the RFC 0031 always-warm posture).

Concretely, once the set is warm at construction, the following AR-layer
scaffolding added by #3960 should be removed/collapsed back onto the Rails shape:

- `AttributeSet#writeFromUser` (`packages/activemodel/src/attribute-set.ts`):
  drop the lazy non-null `else` branch and widen to the Rails one-liner
  `this.attributes.set(name, this.getAttribute(name).withValueFromUser(value))`
  for all names (vendor `attribute_set.rb:58-61` → Null → MissingAttributeError).
- `ensureWritableAttribute` (`packages/activerecord/src/readonly-attributes.ts`):
  the warm-cache-gated guard (`reflectedColumnNamesIfWarm`, counter-cache and
  declared-attribute allow-lists, `_initializingAttributes` window) becomes
  unnecessary once the set itself raises; remove it and let `writeFromUser` raise.
- `_writeAttribute` (`readonly-attributes.ts`): currently intentionally NOT
  strict (documented exemption — store-accessor fallbacks, composite-PK seeding,
  pre-warm writes). Rails' `_write_attribute` does reach `write_from_user` and
  raises (vendor `write.rb:42`); re-converge once those internal writers no
  longer rely on lenience.
- `Model._readAttribute`'s `has(name)` short-circuit should likewise defer to the
  Null fallthrough once the set is complete (noted in the original story).
- The `_initializingAttributes` constructor-window flag
  (`packages/activemodel/src/model.ts`) and the mass-assignment
  `MissingAttributeError` rescue (`attribute-assignment.ts`) exist only to keep
  construction/mass-assignment lenient while the set is incomplete; revisit
  whether they are still needed once warm.

Helpers added by #3960 that may be removable after this: `includesName`
(attribute-set.ts), `reflectedColumnNamesIfWarm` (model-schema.ts).

## Acceptance criteria

- [ ] `AttributeSet#writeFromUser` raises `MissingAttributeError` for ANY name
      not in the set, matching Rails (no lazy `else`).
- [ ] AR-layer `ensureWritableAttribute` warm-cache scaffolding removed (or
      reduced to the `id`→primary_key remap that mirrors `write.rb:35`).
- [ ] `_writeAttribute` re-converged to raise like Rails' `_write_attribute`,
      with internal writers no longer depending on lenience.
- [ ] No regression to construction, mass assignment, counter-cache writes,
      composite/custom PK assignment, or unselected-column writes.
- [ ] Depends on RFC 0031 schema-cache-always-warm being complete.
