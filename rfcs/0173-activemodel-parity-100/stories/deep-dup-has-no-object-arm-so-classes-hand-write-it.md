---
title: "activesupport deepDup lacks Object#deep_dup's duplicable arm, so Attribute and Error hand-write it"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8411
claim: "2026-10-02T17:22:05Z"
assignee: "tests-without-assertions-reads-an-invented-source-location-seat"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-burn-extra-surface-to-zero` (RFC 0173), which credited the per-class
`deepDup()` on `Attribute` and `Error` in the extra-surface scorer rather than deleting them.

Rails' `Object#deep_dup` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/deep_dup.rb:15-17`) is

```ruby
def deep_dup
  duplicable? ? dup : self
end
```

so `attributes.transform_values(&:deep_dup)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:72-74`)
and `other.errors.deep_dup` (`vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:139`) reach
`Attribute#initialize_dup` / `Error#initialize_dup` on classes that define no `deep_dup` of their own.

trails' `deepDup` (`packages/activesupport/src/hash-utils.ts:65-93`) has no such arm. For an object that is
not an Array, a `Hash` or a plain object it dispatches to a `deepDup()` method when the class carries one
(`:82-84`) and otherwise returns the object itself (`:92`), where Ruby dups any duplicable object. That is
why `packages/activemodel/src/attribute.ts` (`deepDup() { return this.dup(); }`) and
`packages/activemodel/src/error.ts` (`deepDup() { return rbObjDup(this); }`) each hand-write the body of
`Object#deep_dup`, and why `packages/activemodel/src/attribute-set.ts:179` calls `attr.deepDup()` as a
method. `scripts/api-compare/extra-surface.ts` (`OBJECT_AMBIENT_METHODS`) credits those members as the
port of `Object#deep_dup`.

The blocker to converging in place is `rbObjDup` on JS built-ins: `Object.create` + descriptor copy
yields a broken `Date`, `Map`, `Set` or `Temporal` value, so the `duplicable?` arm needs a decision for
those receivers before `deepDup` can fall through to `rbObjDup`.

## Acceptance criteria

- [ ] `deepDup(obj)` answers `isDuplicable(obj) ? rbObjDup(obj) : obj` for an object that is not an Array, a `Hash` or a plain object, with the JS built-ins that `rbObjDup` cannot copy handled explicitly.
- [ ] `Attribute#deepDup` and `Error#deepDup` are deleted; their callers go through `deepDup(...)`.
- [ ] `OBJECT_AMBIENT_METHODS` is removed from `scripts/api-compare/extra-surface.ts` with its test, and `pnpm parity:api:extra --package activemodel` still reports total 0.
- [ ] `packages/activesupport/src/core-ext/object/deep-dup.test.ts`, activemodel's `attribute-set` and `errors` tests, and activerecord's `dup.test.ts` stay green.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm vitest run packages/activesupport/src/core-ext/object/deep-dup.test.ts packages/activemodel/src/attribute-set.test.ts packages/activemodel/src/errors.test.ts packages/activerecord/src/dup.test.ts
```
