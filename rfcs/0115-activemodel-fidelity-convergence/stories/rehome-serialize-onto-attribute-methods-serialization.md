---
title: "rehome-serialize-onto-attribute-methods-serialization"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
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

## Context

`ActiveRecord::AttributeMethods::Serialization::ClassMethods#serialize`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/serialization.rb:183-205`)
is a class method of the module `attribute_methods.rb:20` includes, and it sits
in the same Ruby file as its two private helpers, `build_column_serializer`
(:208-223) and `type_incompatible_with_serialize?` (:225-228).

In trails those two helpers ARE in the Rails file —
`packages/activerecord/src/attribute-methods/serialization.ts` exports
`buildColumnSerializer` and `isTypeIncompatibleWithSerialize`, along with
`ColumnSerializer` and `ColumnNotSerializableError` — but `serialize` itself is
not: its body lives in `packages/activerecord/src/serialize.ts` (a trails split
with no Rails counterpart file), and it reaches `Base` as a class-body
`static serialize` in `packages/activerecord/src/base.ts` delegating to it.

Surfaced in review of `give-the-remaining-attribute-methods-seats-real-include-calls`
(PR #7170), which gave the attribute_methods.rb:20 seat a real
`include(Base, _AttrSerialization)` carrying the module's `included do`
(serialization.rb:19-21, the `default_column_serializer` class attribute) but
could not also move the class method: `serialize.ts` imports
`isTypeIncompatibleWithSerialize` and `ColumnNotSerializableError` FROM
`attribute-methods/serialization.ts`, so having `serialization.ts` import
`serialize` back closes an import cycle. Re-homing has to move the body, not add
an edge.

## Acceptance criteria

- [ ] `serialize`'s body lives in
      `packages/activerecord/src/attribute-methods/serialization.ts` at the
      Rails name, beside the `buildColumnSerializer` /
      `isTypeIncompatibleWithSerialize` helpers it calls, mirroring
      serialization.rb:183-205 branch for branch.
- [ ] It reaches `Base` through a `ClassMethods` object and an `extend()` call
      at the attribute_methods.rb:20 seat in `base.ts`, not a class-body static.
- [ ] The `serialize.ts` ↔ `attribute-methods/serialization.ts` import cycle is
      gone (no zero-import slot needed — this is a body move, not a deferral).
- [ ] The call-site comment at the :20 seat in `base.ts` pointing at this story
      is removed.
- [ ] `pnpm parity:api` credits `serialize` against serialization.rb; suite
      green on all three adapter lanes.
