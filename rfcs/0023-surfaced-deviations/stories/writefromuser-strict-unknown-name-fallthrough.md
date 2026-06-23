---
title: "writeFromUser raises for any unknown column name, not just null (full Rails strictness)"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: 3960
claim: "2026-06-23T02:59:17Z"
assignee: "writefromuser-strict-unknown-name-fallthrough"
blocked-by: null
---

## Context

PR #3624 converged the nil-primary-key `id`/`id=` path: `AttributeSet#writeFromUser`
(`packages/activemodel/src/attribute-set.ts`) now falls through to the Null attribute
for an **absent (null) name**, mirroring Rails `write_from_user`
(`vendor/rails/activemodel/lib/active_model/attribute_set.rb:59-61`):
`@attributes[name] = self[name].with_value_from_user(value)` → `Attribute.null(name)`
→ `Null#with_value_from_user` raises `MissingAttributeError`.

Remaining deviation: for a **non-null unknown name**, trails still materializes a
fresh `FromUser` attribute (the `else` branch in `writeFromUser`) instead of raising.
Rails raises for _any_ name not in the set, because its `AttributeSet` is fully
populated from the schema at construction. Trails populates the set lazily — real
columns are not all present when a record is constructed (verified: composite/custom
PK columns and `key_number`/`author_id` are absent from `_attributes` for freshly
built models that have not loaded schema), so map-absence does not yet imply
"unknown column" for a real name. Making `writeFromUser` strict today regresses the
save path (writing a DB-generated PK back to a not-yet-materialized column) and
in-memory composite-PK assignment.

Full convergence is gated on the attribute set being warmed with all schema columns
at construction (schema-cache-always-warm work, RFC 0031 / the parked
virtual-reconcile-warm-schema-cache effort). Once the set is complete, the `null`
guard in `writeFromUser` can widen to the Rails one-liner
`this.attributes.set(name, this.getAttribute(name).withValueFromUser(value))` for all
names, and `Model._readAttribute`'s `has(name)` short-circuit can likewise defer to
the Null fallthrough.

## Acceptance criteria

- [ ] `writeFromUser(unknownName, v)` raises `MissingAttributeError` for ANY name not
      backing a real column (not just null), matching Rails `write_from_user`.
- [ ] No regression to the insert PK write-back path or composite/custom PK assignment
      (the `ctor.primaryKey != null` guard in `base.ts:_createOrUpdate` and the lazy
      `else` branch can be removed only once the set is fully warmed).
- [ ] Depends on / coordinated with schema-cache-always-warm convergence (RFC 0031).
