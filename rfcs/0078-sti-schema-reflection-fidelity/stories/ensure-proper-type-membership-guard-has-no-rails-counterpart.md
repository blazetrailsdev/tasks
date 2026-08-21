---
title: "ensure_proper_type's membership guard has no Rails counterpart"
status: ready
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ensure_proper_type` writes the STI type unconditionally once
`finder_needs_type_condition?` says the class participates:

```ruby
# vendor/rails/activerecord/lib/active_record/inheritance.rb:331-336
def ensure_proper_type
  klass = self.class
  if klass.finder_needs_type_condition?
    _write_attribute(klass.inheritance_column, klass.sti_name)
  end
end
```

trails carries an extra guard in `ensureProperType`
(`packages/activerecord/src/inheritance.ts`):

```ts
if (inheritCol === null) return;
if (!classHasAttribute(klass, inheritCol)) return; // no Rails counterpart
```

trails#6805 converged the guard's _reader_ (it now asks `_has_attribute?` rather
than the invented `_attributeDefinitions` map) but left the guard itself. It
exists because a strict `_writeAttribute` raises on an attribute the model does
not know, and trails reflects lazily, so the column can be unknown at
construction time where Rails' `attribute_types` has already loaded the schema
synchronously (`attribute_registration.rb:37-40`, `model_schema.rb:534-545`).

The `inheritCol === null` arm is _not_ the deviation — Rails' `inheritance_column`
can be nil and `finder_needs_type_condition?` already answers false for it; that
arm is a defensive duplicate at worst.

## Converged shape

`ensureProperType` writes whenever `finderNeedsTypeCondition` is true, with no
membership test — the guard is deleted once construction can rely on the
inheritance column being a known attribute (i.e. once the schema is loaded by
then, or the strict write path tolerates it the way Ruby's does).

## Acceptance criteria

- [ ] `ensureProperType` has no `_has_attribute?`/membership guard, matching
      `inheritance.rb:331-336` line for line.
- [ ] A cold, unreflected STI subclass still gets its type written on `new`
      rather than raising an unknown-attribute error — covered by a test that
      fails on the baseline with the guard removed.
- [ ] `inheritance` and `sti` suites stay green on all four adapter lanes.
