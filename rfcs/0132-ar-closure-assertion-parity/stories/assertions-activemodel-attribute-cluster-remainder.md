---
title: "assertions-activemodel-attribute-cluster-remainder"
status: in-progress
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7913
claim: "2026-09-20T14:39:06Z"
assignee: "assertions-activemodel-attribute-cluster-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-activemodel-attribute-cluster` (RFC 0132). That story's PR
converged four of its seven Rails files to 0 mismatches — `attribute_test.rb`,
`attribute_set_test.rb`, `attribute_assignment_test.rb` and `type/string_test.rb`
(97 of 183 mismatches, ~2,100 LOC) — and stopped at the band the RFC blesses. These
three files are what is left, re-measured on that branch:

| Rails file                       | count | kind | value |  total |
| -------------------------------- | ----: | ---: | ----: | -----: |
| `attribute_methods_test.rb`      |    15 |   18 |    10 |     43 |
| `attribute_registration_test.rb` |    10 |   13 |     3 |     26 |
| `attributes_test.rb`             |     7 |    9 |     1 |     17 |
| **total**                        |    32 |   40 |    14 | **86** |

Expand per-test detail with:

```bash
pnpm parity:test -- --package activemodel --assertions --missing
```

TS-only extras to move into the `.trails.test.ts` sibling:
`attribute_methods_test.rb` 10, `attribute_registration_test.rb` 7.
`attribute-methods.trails.test.ts` already exists; so does
`attributes.trails.test.ts`.

### Scope: one file, the other two filed (resized 2026-09-20)

Re-scoped after measuring, exactly as this story was itself carved out of
`assertions-activemodel-attribute-cluster` — that story converged four of its
seven files and stopped at the band the RFC blesses.

All three trails files need a full-file rewrite rather than an assertion edit (see
below), so each costs its current size in deletions plus its port in additions:

| file                             | deletions | est. additions | churn |
| -------------------------------- | --------: | -------------: | ----: |
| `attributes.test.ts`             |       196 |            176 |   372 |
| `attribute-registration.test.ts` |       589 |           ~350 |  ~940 |
| `attribute-methods.test.ts`      |       650 |           ~400 | ~1050 |

The PR ceiling is 700 LOC (additions + deletions; tests count). Either remaining
file alone lands the PR near 1,300 and both put it past 2,300 — the ≥700 band
review-cycle data shows needing 13+ rounds. CLAUDE.md § Conventions makes the
ceiling the hard rule and filing the remainder the prescribed remedy, so this
story ships `attributes_test.rb` and the other two are owned separately:

- `assertions-activemodel-attribute-registration` — `attribute_registration_test.rb`
  (10 count / 13 kind / 3 value, 7 TS-only extras)
- `assertions-activemodel-attribute-methods` — `attribute_methods_test.rb`
  (15 / 18 / 10, 10 TS-only extras)

### What the shape of the work is (learned on the first slice)

All three trails files have the same defect as the four already converged: the test
NAMES match Rails but the bodies are unrelated — each `it` builds an ad-hoc
`class Person extends Model` with `name`/`age` attributes and asserts `Alice`/`Bob`,
where Rails asserts against its own fixtures. That is why the value mismatches read
`equal rails [s:value of foo] vs trails [s:Alice]`. **The fix is a full-file rewrite
against the Rails test's own models, not an edit of the existing assertions.** Mirror:

- `attributes_test.rb:7-42` — `ModelForAttributesTest` (`integer_field`,
  `string_field`, `decimal_field`, `string_with_default`, `date_field`,
  `boolean_field`), `ChildModelForAttributesTest`,
  `GrandchildModelForAttributesTest`, `ModelWithGeneratedAttributeMethods`,
  `ModelWithProxiedAttributeMethods`. Keep the snake_case attribute NAMES verbatim —
  they are literal expected values in `reading attribute names`
  (`attributes_test.rb:96-108`), so camelCasing them re-introduces value mismatches.
  Generated readers are properties in trails (CLAUDE.md § "Generated attribute
  readers are properties"), so declare them on a merged
  `interface ModelForAttributesTest`, not in the class body.
- `attribute_registration_test.rb` and `attribute_methods_test.rb` — same treatment
  against their own Rails classes.

Idioms the first slice settled, reuse them rather than re-deriving:

- `assert_predicate` / `assert_not_predicate` are the truthiness pair
  (`scripts/test-compare/assertion-kinds.ts:100-107`) — port as
  `expect(x.isFoo()).toBeTruthy()` / `toBeFalsy()`.
- `assert_respond_to` / `assert_not_respond_to` need
  `assertRespondTo` / `assertNotRespondTo` from `@blazetrails/activesupport`
  (`activesupport/src/testing/assertions.ts:374-387`); no vitest matcher maps to
  `respondTo`. `attribute_methods_test.rb` needs these in five tests.
- `assert_raises` that binds the error is
  `await assertRaises([Klass], {}, () => …)`, which returns it.
- `assert_not_equal a, b` where trails compares through an `equals()` method: write
  `expect(a.equals(b)).not.toEqual(true)`. A bare `expect(a.equals(b)).toBe(false)`
  scores `equal`, not `notEqual`, and leaves the kind mismatch in place.
- `assert_nil` on a trails `Uninitialized#value` is `toBeUndefined()` (which
  normalizes to `nil`), because that getter answers `undefined`, not `null`.
- `assert_same` / `assert_not_same` fold onto `equal` / `notEqual`
  (`assertion-kinds.ts` `HISTOGRAM_FOLD`), so `toBe` / `not.toBe` are the twins.
- A Ruby `define_singleton_method(:deserialize)` on a type is a plain instance-field
  assignment in trails (`type.deserialize = …`), which shadows the prototype method
  exactly as the singleton does.
- A bare Ruby helper class used as a type (Rails' `InscribingType`, `MyType`) has to
  `extend ValueType` in trails, because `Attribute` is typed against it and
  `FromUser#_valueForDatabase` calls `type.itselfIfSerializeCastValueCompatible()`.

Three of Rails' `method_missing` / `respond_to?` arms in `attribute_methods_test.rb`
may be unreachable under CLAUDE.md § "Records are not Proxies" and § "Method
visibility is not a runtime fact in JS" — check both sections before porting
`should not interfere with method_missing if the attr has a private/protected method`
and `should not interfere with respond_to? if the attribute has a private/protected
method`, and port only the assertions that do not depend on the hook.

A converged assertion that then fails is a story, not a detour: land it, park it as
`it.skip` with one `BLOCKED:` line, and file it under RFC
`0155-assertion-surfaced-port-bugs`. The first slice filed three that way —
`assertions-immutable-js-string-values`,
`attribute-from-database-forgetting-assignment-returns-self`,
`attribute-assignment-argument-error-names-js-number-not-integer`.

## Acceptance criteria

- [ ] `attributes_test.rb` reports 0 assertion-count, 0 assertion-kind and
      0 assertion-value mismatches in
      `pnpm parity:test -- --package activemodel --assertions`, or the residue is
      carried by filed 0155 stories for parked rows.
- [ ] `attribute_registration_test.rb` and `attribute_methods_test.rb` are filed
      as their own 0132 stories, each carrying the measured mismatch counts, the
      Rails `file:line` anchors and the idioms this cluster settled.
- [ ] TS-only extras live in the `.trails.test.ts` siblings, not in the
      Rails-matched files.
- [ ] No test renamed; `parity:test`'s file count for `activemodel` does not drop.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` unchanged.
