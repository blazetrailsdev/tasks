---
title: "assertions-immutable-js-string-values"
status: ready
updated: 2026-09-22
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

Surfaced by `assertions-activemodel-attribute-cluster` (RFC 0132) while converging
the `Attribute` / `AttributeSet` / `Type::String` assertion bodies to Rails, and
extended by `assertions-activemodel-dirty-serialization-callbacks` (trails#7907),
which hit the same root cause in `attributes_dirty_test.rb`.

Eight Rails tests assert behaviour that only exists because a Ruby `String` is a
**mutable object with identity**: `str << "x"` mutates in place, `str.dup` is a
different object, and `+"foo"` / `-"foo"` differ in `frozen?`. A JS string is an
immutable primitive: `Object.isFrozen("foo")` is `true`, `type.cast(s) === s`, and
there is no in-place append. So each converged body was landed with Rails' exact
assertion count, kinds and expected values and then parked as `it.skip` with a
`BLOCKED: assertions-immutable-js-string-values` line.

Parked tests (all in `packages/activemodel/src/`):

| file                       | test                                                         | Rails `file:line`                                       |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `attribute.test.ts`        | `duping dups the value`                                      | `activemodel/test/cases/attribute_test.rb:130-134`      |
| `attribute.test.ts`        | `an attribute is changed if it has been mutated`             | `attribute_test.rb:257-263`                             |
| `attribute.test.ts`        | `with_type preserves mutations`                              | `attribute_test.rb:318-323`                             |
| `attribute-set.test.ts`    | `duping creates a new hash, but does not dup the attributes` | `attribute_set_test.rb:35-50`                           |
| `attribute-set.test.ts`    | `deep_duping creates a new hash and dups each attribute`     | `attribute_set_test.rb:52-67`                           |
| `type/string.test.ts`      | `cast strings are mutable`                                   | `activemodel/test/cases/type/string_test.rb:24-33`      |
| `type/string.test.ts`      | `values are duped coming out`                                | `type/string_test.rb:35-43`                             |
| `attributes-dirty.test.ts` | `attribute mutation`                                         | `activemodel/test/cases/attributes_dirty_test.rb:66-72` |

What Rails asserts vs what the port does:

- `Attribute#initialize_dup` (`activemodel/lib/active_model/attribute.rb:155-159`)
  dups a duplicable `@value`; trails' `dupValue` (`attribute.ts:8-17`) returns a
  JS string unchanged, so `attribute.value` and `attribute.dup().value` are the
  same primitive where Ruby's are two objects.
- `Type::String#cast_value` (`activemodel/lib/active_model/type/string.rb:23-32`)
  returns `+value` (an unfrozen dup); trails returns the primitive, so
  `assert_not_same` and `assert_equal false, …frozen?` both invert.
- `attribute.value << "!"` has no JS spelling at all, so the two `changed_in_place?`
  and two dup tests cannot express their setup.
- `attributes_dirty_test.rb:70`'s `@model.name.replace("Hadad")` is the same gap one
  layer up, at the model rather than the `Attribute`: Ruby's `String#replace` mutates
  the receiver, so `changed_in_place?` (`activemodel/lib/active_model/attribute.rb:104-107`,
  `attribute_mutation_tracker.rb:41-48`) sees the re-serialized value differ. A JS
  string is an immutable primitive and `ruby-compat` has no `String#replace` twin, so
  the mutation step is a no-op and `nameChanged()` stays `false`. `dirty_test.rb`'s own
  `attribute mutation` (`dirty_test.rb:91-98`) is NOT affected — its body drives the
  same state through `name_will_change!`, which trails can call.

How far this story got: nothing here is a port bug that a code change fixes — it is
the mutable-`String` language shortcoming. The decision this story owes is whether
trails ratifies it repo-wide in `CLAUDE.md` (the way § "Records are not Proxies" and
§ "Serialization's dual sync/async hash" ratify theirs) and converts these eight
`BLOCKED:` parks into `PERMANENT-SKIP` stubs, or introduces a mutable string
carrier. Do not soften the parked bodies to make them pass.

A closed duplicate,
`attributes-dirty-attribute-mutation-needs-in-place-string-mutation`, was filed for
the eighth row before this story was found; it is closed against this one.

## Acceptance criteria

- [ ] A decision is recorded: either a `CLAUDE.md` section ratifying immutable JS
      strings repo-wide, or a mutable-string carrier that lets these bodies run.
- [ ] Each of the eight parked tests is either unparked (running, assertions
      unchanged) or re-marked under whatever the decision names, with no assertion
      count/kind/value drift.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_test.rb`, `attribute_set_test.rb`,
      `type/string_test.rb` and `attributes_dirty_test.rb`.
