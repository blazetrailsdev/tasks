---
title: "ruby-mutable-string-carrier"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
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

Blocker for `assertions-immutable-js-string-values`, whose eight parked
ActiveModel tests (`attribute.test.ts` ×3, `attribute-set.test.ts` ×2,
`type/string.test.ts` ×2, `attributes-dirty.test.ts` ×1) assert behaviour that
exists only because a Ruby `String` is a mutable object with identity.

What those bodies need, measured against the Rails source:

- **Identity across `dup`.** `Attribute#initialize_dup`
  (`activemodel/lib/active_model/attribute.rb:155-159`) dups a duplicable
  `@value`; `assert_not_same attribute.value, attribute.dup.value`
  (`activemodel/test/cases/attribute_test.rb:130-134`,
  `attribute_set_test.rb:35-67`). trails' `dupValue`
  (`packages/activemodel/src/attribute.ts`) returns a JS string unchanged, and
  two equal JS string primitives are `===`/`Object.is`.
- **An unfrozen cast result.** `Type::String#cast_value`
  (`activemodel/lib/active_model/type/string.rb:23-32`) returns `+value` and
  `-value`-interned inputs come back unfrozen
  (`activemodel/test/cases/type/string_test.rb:24-43`). `Object.isFrozen("x")`
  is `true` for every JS string primitive.
- **In-place mutation.** `attribute.value << "!"`
  (`attribute_test.rb:257-263`, `:318-323`) and `@model.name.replace("Hadad")`
  (`attributes_dirty_test.rb:66-72`) mutate the receiver so
  `changed_in_place?` (`attribute.rb:104-107`,
  `attribute_mutation_tracker.rb:41-48`) sees the re-serialized value differ.
  JS has no in-place string append and ruby-compat has no `String#replace` twin.

None of these is reachable with JS string primitives. The only convergent
shape is a mutable string carrier: a ruby-compat class holding the character
data (with `<<`/`concat`, `replace`, `dup`, `freeze`/`isFrozen`, and
`toString`/`valueOf`/`Symbol.toPrimitive` so it still interpolates) that
`Type::String#cast_value` returns instead of a primitive.

Measured blast radius: every `:string`/`:text` attribute read in activemodel
and activerecord flows through `ImmutableString`/`String` `cast_value`, and the
repo compares those reads with `===`, uses them as `Map`/object keys, passes
them to `JSON.stringify`, and to adapter bind/quote paths that `typeof x ===
"string"`. Switching the returned type is an RFC-sized change (design of the
carrier, where it is unwrapped, and a sweep of every `typeof … === "string"`
consumer), not a story.

## Acceptance criteria

- [ ] A design (RFC or RFC section) for a ruby-compat mutable string carrier:
      API surface (`<<`, `concat`, `replace`, `dup`, `freeze`, `isFrozen`,
      primitive coercion), and where it is unwrapped to a primitive (adapter
      binds, `JSON`, hash keys).
- [ ] `Type::String#cast_value` returns the carrier (`+value`, unfrozen) per
      `activemodel/lib/active_model/type/string.rb:23-32`, and `dupValue` dups
      it per `attribute.rb:155-159`.
- [ ] The eight `BLOCKED: assertions-immutable-js-string-values` tests run with
      their assertions unchanged.
