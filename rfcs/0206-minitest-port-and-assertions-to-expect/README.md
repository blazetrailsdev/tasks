---
rfc: "0206-minitest-port-and-assertions-to-expect"
title: "Move test code onto Vitest expect, with vitest-matchers for Ruby semantics; Minitest stays vendored as reference"
status: draft
created: 2026-10-22
updated: 2026-10-23
owner: "@deanmarano"
packages:
  - activesupport
  - vitest-matchers
  - actionpack
  - actionview
  - activejob
  - activemodel
  - activerecord
  - trailties
  - globalid
  - arel
  - rack-test
  - minitest
clusters:
  - assertion-tooling
  - expect-sweeps
  - close-out
  - minitest-package
---

# RFC 0206 — Move test code onto Vitest expect; Minitest stays vendored as reference

> `minitest-package` (cluster) and `minitest` (package) stay declared only
> because the four closed `FALSIFIED` stories of the first draft still carry
> them; nothing open is in that cluster.
>
> The slug still says `minitest-port`: the tasks CLI has no RFC rename verb,
> and every story row is keyed on this id. The title is what changed. **Nothing
> in this RFC ports Minitest.**

## Summary

`packages/activesupport/src/testing/assertions.ts` holds two things in one
file: Rails' `ActiveSupport::Testing::Assertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb`)
and a hand port of most of `Minitest::Assertions`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb`). Test code across ten
packages calls the Minitest half: 5,938 call sites in 392 test files.

By repo-owner ruling (2026-10-23): _"I don't want minitest ported, I want it
vendored for reference, but I just want vitest-expect assertions that help with
porting."_ So:

1. **Minitest is not ported.** There is no `@blazetrails/minitest` package.
   `vendor/minitest/v5.27.0/` stays vendored as reference only — what each
   `assert_*` checks and the failure message it builds — and it is not
   enrolled in `parity:api`. RFC 0098's won't-do on
   `map-vendored-minitest-and-drop-norailsequivalent` stands.
2. **Test code uses Vitest `expect`**, by CONTRIBUTING.md § "Porting a Minitest
   assertion": the built-in matcher by default, a
   `@blazetrails/vitest-matchers` matcher where the built-in gives the wrong
   answer for the value under test. vitest-matchers exists so that porting a
   Minitest/Rails assertion is easy and faithful (Ruby truthiness, Ruby `==`,
   Ruby `include?`, `kind_of?`); § "Matchers" proposes what it still lacks.
3. **The Minitest half of `testing/assertions.ts` is deleted** once its callers
   are swept, leaving Rails' `ActiveSupport::Testing::Assertions` only.

Rails' own assertion modules call Minitest assertions inside their bodies.
By owner ruling (2026-10-23) those calls become plain `expect` with Rails'
message as the second argument, and the call gate credits the equivalence once
(§ "Assertions inside ported Rails bodies").

## Motivation

The CONTRIBUTING.md table is ratified, and the tree does not follow it.
RFC 0158 (`minitest-builtin-asserts-port-as-expect`, done) wrote the table and
filed caller sweeps plus a deletion. Since then the helpers spread through the
`@blazetrails/activesupport` index into activerecord, activemodel, activejob,
globalid, arel and rack-test, and the usage grew several-fold
(`assertPredicate`: 22 files then, 99 now). RFC 0158's six
`minitest-asserts-to-expect-*-callers` sweeps and
`delete-minitest-builtin-assert-helpers` are closed as superseded by this RFC
(2026-10-23), so the sweep and the deletion have one owner.

A hand-ported Minitest that test code imports is a second assertion library
beside Vitest's, with its own failure messages and its own counter, scored as
`@noRailsEquivalent` surface in a file that mirrors a different `.rb`. Porters
need to know what `assert_includes` _means_; they read that in the vendored
source and write the matching `expect`.

### Measurements

Every count in this RFC comes from one of these commands, run 2026-10-22 on
trails `1b769d8daa`.

Call sites in test code, resolved by import (a file counts for a helper only if
it imports that name from `@blazetrails/activesupport` or a relative
`testing/assertions.js`, and calls it):

```bash
N='assert|assertEqual|assertNotEqual|assertNil|assertNotNil|assertMatch|assertNoMatch|assertInDelta|assertEmpty|assertNotEmpty|assertIncludes|assertNotIncludes|assertSame|assertNotSame|assertOperator|assertInstanceOf|assertKindOf|assertNotKindOf|assertRespondTo|assertNotRespondTo|assertPredicate|assertNotPredicate'
for f in $(rg -l --glob '*.test.ts' -P "\b($N)\(" packages/*/src); do
  imp=$(rg -U -o -P "import \{[^}]*\} from \"(@blazetrails/activesupport|[./]*testing/assertions\.js)\"" $f | tr '\n' ' ')
  [ -z "$imp" ] && continue
  for n in ${N//|/ }; do
    echo "$imp" | grep -qP "[{,\s]$n[,\s}]" || continue
    c=$(rg -o -P "\b$n\(" $f | wc -l)
    [ $c -gt 0 ] && printf '%s\t%s\t%s\t%s\n' "$(echo $f | cut -d/ -f2)" "$f" "$n" "$c"
  done
done
```

Calls Rails' own testing modules make into Minitest:

```bash
grep -noP "\b(assert\w*|refute\w*|message|diff|mu_pp)\b" \
  vendor/rails/v8.0.2/activesupport/lib/active_support/testing/{assertions,method_call_assertions,error_reporter_assertions}.rb
```

Vitest built-in behaviour was checked with a throwaway `*.test.ts` probe, not
assumed (results quoted in the table).

| package       | test files | call sites |
| ------------- | ---------: | ---------: |
| actionpack    |        109 |      2,577 |
| activerecord  |         98 |      1,173 |
| actionview    |         34 |        579 |
| activesupport |         80 |        570 |
| activemodel   |         37 |        559 |
| trailties     |         14 |        242 |
| activejob     |         10 |        173 |
| globalid      |          4 |         53 |
| rack-test     |          3 |          7 |
| arel          |          3 |          5 |
| **total**     |    **392** |  **5,938** |

## Design

### The line through `testing/assertions.ts`

**Stays in activesupport, at its Rails name:** `assertNot`, `assertRaises`
(and its `assertRaise` alias), `assertNothingRaised`, `assertDifference`,
`assertNoDifference`, `assertChanges`, `assertNoChanges`,
`_assertNothingRaisedOrWarn`, `_callableToSourceString`, and `UNTRACKED` —
`ActiveSupport::Testing::Assertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb:21-252`).
Likewise `MethodCallAssertions` and `ErrorReporterAssertions` are Rails files
and stay.

**Deleted, once callers are swept:** the 22 test-facing Minitest helpers in the
table below, plus `diff` and `message`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:57,632`), and their
re-exports from `packages/activesupport/src/index.ts` (around `:598-639`). How
the Rails bodies that call them are written afterwards is § "Assertions inside ported Rails bodies".

**Out of scope:** the Minitest runner classes that sit in activesupport today
(`Assertion`, `Skip`, `UnexpectedError`, `BacktraceFilter`, `Test`, the
`Minitest` module; `vendor/minitest/v5.27.0/lib/minitest.rb:1035-1190`,
`lib/minitest/test.rb:10`) and `Mock` / `stub` / `assertMock`
(`lib/minitest/mock.rb`). `ActiveSupport::TestCase`, `autorun.ts`,
`setup-and-teardown.ts` and `tests-without-assertions.ts` read them, and their
fate is a separate decision (Open question 2). This RFC neither moves nor
deletes them.

### Per-helper disposition

For test code. Ported Rails bodies are § "Assertions inside ported Rails bodies". Three
dispositions: **built-in** (a Vitest matcher means the same for every value it
is used on), **matcher** (the built-in is wrong for some values and a
`@blazetrails/vitest-matchers` matcher covers them, existing or proposed in
§ "Matchers"), **delete** (the export goes away). "Gate" is the
`parity:test:assertions` kind the rewrite scores, against the kind
`scripts/test-compare/assertion-kinds.ts` gives the Rails assertion.

| helper               | files | calls | disposition         | replacement                                                                                                                                                         | why the Ruby semantics do not bite                                                                                                                                                                                                                                                                                                                                                                                                       | gate                                                                                                                                              |
| -------------------- | ----: | ----: | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assertEqual`        |   129 | 2,136 | built-in + existing | `toEqual(exp)`; `toBe(exp)` for a primitive; `toEqualRuby(exp)` where either side defines Ruby `==` (records, `Duration`, `BigDecimal`, `Time`, ruby-compat `Hash`) | The helper is `rbEqual` (`assertions.ts:880`, minitest `assertions.rb:220`). `toEqual` agrees on primitives, Arrays, plain objects and Map contents (probe: a filled `Map` is not `toEqual` an empty one). It disagrees where Ruby `==` is a method: it ignores class (probe: `new A()` with `x = 1` `toEqual` `{ x: 1 }` passes), ignores `undefined` properties, and compares a record field by field where `==` compares class and id | `equal` → `equal` (`toBe` is `equal` too)                                                                                                         |
| `assertNotEqual`     |    14 |    49 | built-in + existing | `.not.toEqual` / `.not.toEqualRuby`                                                                                                                                 | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEqual` → `notEqual`                                                                                                                           |
| `assertPredicate`    |    99 |   903 | built-in + existing | boolean-typed predicate: `expect(o.isFoo()).toBe(true)`; value-returning predicate: `expect(o.foo()).toBeRubyTruthy()`                                              | Minitest's is `assert o1.__send__ op` (`assertions.rb:394`): Ruby truthiness. For a `boolean` value `toBe(true)` is exact; a value that can be `0` or `""` needs Ruby truthiness                                                                                                                                                                                                                                                         | `truthy` → **`equal` today for `toBe(true)`**; `truthy` once `assertion-kinds-reads-literal-matcher-arguments` lands. `toBeRubyTruthy` → `truthy` |
| `assertNotPredicate` |    56 |   377 | built-in + existing | `toBe(false)` / `toBeRubyFalsy()`                                                                                                                                   | as above; `toBeFalsy` wrongly passes on `0`                                                                                                                                                                                                                                                                                                                                                                                              | `falsy` → **`equal` today**; `falsy` after the tooling story                                                                                      |
| `assert`             |    94 |   560 | built-in + existing | `toBe(true)` for a boolean; `toBeTruthy()` where the value cannot be `0`, `""` or `NaN`; else `toBeRubyTruthy()`                                                    | `assert` is `test` truthiness (`assertions.rb:171`)                                                                                                                                                                                                                                                                                                                                                                                      | `truthy` → `truthy` (`toBe(true)`: as `assertPredicate`)                                                                                          |
| `assertNil`          |   107 |   407 | built-in            | `toBeNull()` where the port produces `null`; `toBeUndefined()` where it produces `undefined`                                                                        | Ruby has one `nil`. Map it onto the one JS value the port returns. A value that can be both is a port with two nils: converge the source or file it, do not hide it in the assertion. (Probe: `toBeNull` fails on `undefined`, as it should)                                                                                                                                                                                             | `nil` → `nil` (both)                                                                                                                              |
| `assertNotNil`       |    18 |    58 | built-in            | `.not.toBeNull()` where the domain is `null \| T`; `toBeDefined()` where it is `undefined \| T`                                                                     | as above. `.not.toBeNull()` passes on `undefined` (probe), so it is only right where `undefined` cannot occur                                                                                                                                                                                                                                                                                                                            | `notNil` → `notNil` (both)                                                                                                                        |
| `assertMatch`        |    42 |   514 | built-in            | `expect(s).toMatch(m)`                                                                                                                                              | A string `m` is a literal in both (the helper escapes it, `assertions.ts:977`; probe: `toMatch(".")` on `"ab"` fails). The helper returns the `MatchData`; a call site that uses the result reads `m.exec(s)` itself                                                                                                                                                                                                                     | `match` → `match`                                                                                                                                 |
| `assertNoMatch`      |    13 |    57 | built-in            | `.not.toMatch(m)`                                                                                                                                                   | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `noMatch` → `noMatch`                                                                                                                             |
| `assertEmpty`        |    81 |   271 | built-in + existing | `toHaveLength(0)` where the receiver has `length`; `toBeEmpty()` for `Map`, `Set`, a Hash or an `isEmpty` object                                                    | The helper calls `isEmpty` (`assertions.ts:649`). An async `isEmpty` (a `Relation`) returns a Promise, and `toBeEmpty` on a Promise fails (probe): `await` the collection's answer first                                                                                                                                                                                                                                                 | `empty` → **`length` today for `toHaveLength(0)`**; `empty` after the tooling story. `toBeEmpty` → `empty`                                        |
| `assertNotEmpty`     |    37 |    93 | built-in + existing | `.not.toHaveLength(0)` / `.not.toBeEmpty()`                                                                                                                         | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEmpty` → `notEmpty` (after the tooling story for `toHaveLength`)                                                                              |
| `assertRespondTo`    |    49 |   171 | existing            | `toRespondTo("m")`                                                                                                                                                  | CONTRIBUTING's built-in is `expect(typeof o.m).toBe("function")`, which misses a name answered by `respond_to_missing?` and scores `equal`, never `respondTo`. `toRespondTo` is `rbObjRespondTo` and scores `respondTo`, so it is the one spelling that both answers right and keeps the kind                                                                                                                                            | `respondTo` → `respondTo`                                                                                                                         |
| `assertNotRespondTo` |    31 |   104 | existing            | `.not.toRespondTo("m")`                                                                                                                                             | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notRespondTo` → `notRespondTo`                                                                                                                   |
| `assertIncludes`     |    24 |    79 | matcher             | `toInclude(o)` (Array, String, Set, Hash/`Map` key); `toContain` for a primitive in an Array or String                                                              | Minitest is `collection.include?(o)` (`assertions.rb:260`): `Array#include?` uses `==` and `Hash#include?` reads keys. `toInclude` is that (`rbEqual` per element, `hashHas` for a Hash). `toContainEqual` is structural and `toContain` on a `Map` ignores keys (probe)                                                                                                                                                                 | `includes` → `includes` once `vitest-matchers-to-include-scores-includes` lands                                                                   |
| `assertNotIncludes`  |    11 |    19 | matcher             | `.not.toInclude(o)`                                                                                                                                                 | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `excludes` → `excludes` (same story)                                                                                                              |
| `assertKindOf`       |    17 |    53 | built-in + matcher  | object of a class: `toBeInstanceOf(cls)`; primitive or module: `toBeKindOf(cls)`                                                                                    | The helper boxes (`Object(obj) instanceof cls`, `assertions.ts:953`); `toBeInstanceOf(String)` on `"x"` fails (probe), and a module in the ancestry is not an `instanceof`                                                                                                                                                                                                                                                               | `kindOf` → `kindOf`                                                                                                                               |
| `assertNotKindOf`    |     1 |     5 | built-in + matcher  | `.not.toBeInstanceOf(cls)` / `.not.toBeKindOf(cls)`                                                                                                                 | as above; Minitest's `refute_kind_of` (`:721`)                                                                                                                                                                                                                                                                                                                                                                                           | no mapped kind either side: unchanged                                                                                                             |
| `assertInstanceOf`   |     8 |    20 | existing            | `toBeExactInstanceOf(cls)`                                                                                                                                          | `instance_of?` is the exact class (`assertions.rb:271`); `toBeInstanceOf` admits subclasses                                                                                                                                                                                                                                                                                                                                              | `instanceOf` → `instanceOf`                                                                                                                       |
| `assertSame`         |    20 |    41 | built-in            | `toBe(exp)`                                                                                                                                                         | `equal?` is identity; `Object.is` is identity for objects. Strings are primitives in trails (CLAUDE.md § "Ruby Strings are JS string primitives"), so two equal Ruby Strings that are different objects are one JS value: ratified                                                                                                                                                                                                       | `same` → `equal`, folded together by `HISTOGRAM_FOLD`                                                                                             |
| `assertNotSame`      |     4 |     6 | built-in            | `.not.toBe(exp)`                                                                                                                                                    | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notSame` → `notEqual`, folded                                                                                                                    |
| `assertInDelta`      |     8 |    12 | existing            | `toBeWithinDelta(exp, delta)`                                                                                                                                       | `toBeCloseTo`'s digit count cannot say "within 0.001"                                                                                                                                                                                                                                                                                                                                                                                    | `inDelta` → `inDelta`                                                                                                                             |
| `assertOperator`     |     2 |     3 | built-in            | `toBeGreaterThan` / `toBeLessThan` / `…OrEqual`                                                                                                                     | All three sites compare numbers. A Comparable non-number (`Time`, `Duration`) would need `expect(a.compareTo(b))…`; none exists today                                                                                                                                                                                                                                                                                                    | `operator` → `operator`                                                                                                                           |
| `diff`, `message`    |   n/a |   n/a | delete              | none in test code; in Rails bodies, § "Assertions inside ported Rails bodies"                                                                                       | machinery; test code never calls them                                                                                                                                                                                                                                                                                                                                                                                                    | n/a                                                                                                                                               |

Every one of the 22 helpers is then deleted from activesupport
(`activesupport-index-drops-minitest-assertion-exports`).

### Matchers

The bar for a vitest-matchers matcher: a Minitest assertion that Rails' tests
use often, whose Ruby meaning a built-in matcher gets wrong for values trails
actually produces, and which no existing matcher already serves. Each one
carries a `TRAILS_MAP` entry (`scripts/test-compare/assertion-kinds.ts`) in the
same PR so the assertion-kind gate scores it as the Rails kind.

**Already there, keep using:** `toEqualRuby` (`assert_equal`, `:220`),
`toBeRubyTruthy` / `toBeRubyFalsy` (`assert` / `assert_predicate`, `:171`,
`:394`), `toBeWithinDelta` (`assert_in_delta`, `:241`), `toBeEmpty`
(`assert_empty`, `:188`), `toBeExactInstanceOf` (`assert_instance_of`,
`:271`), `toRespondTo` (`assert_respond_to`, `:453`).

**Proposed (draft stories):**

| matcher                                           | Minitest assertion it serves          | vendored source                                                  | Rails test uses | built-in gets wrong                                                                                                                                                                                                                                                                                           | story                                        |
| ------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- | --------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `toBeKindOf(cls)` (new)                           | `assert_kind_of` / `refute_kind_of`   | `vendor/minitest/v5.27.0/lib/minitest/assertions.rb:282`, `:721` |             464 | `toBeInstanceOf(String)` fails on `"x"` (no boxing), and cannot answer a module in the ancestry (`assert_kind_of Comparable, t`), which `isModuleIncluded` can                                                                                                                                                | `vitest-matcher-to-be-kind-of`               |
| `toInclude(o)` / `toHaveKey(k)` (exist, unscored) | `assert_includes` / `refute_includes` | `assertions.rb:260`, `:700`                                      |             700 | `toContainEqual` is structural, not `rbEqual` (a record element); `toContain` on a `Map` ignores keys; `toHaveProperty` walks the prototype. `toInclude` is already Ruby `include?` (`packages/vitest-matchers/src/index.ts`, `includes()`), but `TRAILS_MAP` has no entry, so a port using it scores no kind | `vitest-matchers-to-include-scores-includes` |

**Considered and not proposed:**

- `toBeNil` — ruled out by the repo owner (2026-10-22); `nil` maps to the JS
  value the port produces (`toBeNull` / `toBeUndefined`).
- `toSatisfyPredicate("isFoo")` for `assert_predicate o, :foo?` and
  `toSatisfyOperator(">", b)` for `assert_operator` (`:394`, `:315`; 130 Rails
  uses) — each dispatches a method by name, which CLAUDE.md § "A dispatch by
  name is spelled directly" forbids where the name is a literal, as it is at
  every site. `expect(o.isFoo()).toBe(true)` / `toBeRubyTruthy()` and
  `toBeGreaterThan` (or `expect(a.compareTo(b)).toBeGreaterThan(0)` for a
  Comparable non-number) spell it directly.
- `toBeWithinEpsilon` (`assert_in_epsilon`, `:253`) — 1 Rails use.
- `toThrowSymbol` (`assert_throws`, `:500`) — 1 Rails use.
- A custom-message matcher — Minitest's trailing `msg` is Vitest's
  `expect(value, msg)`, built in.

### The assertion-kind gate

`extract-ts-core.ts` records an `expect(...)` chain by its terminal matcher
name and a bare `assert*`/`refute*` callee by its own name, which
`normalizeTrailsKind` snake-cases onto the Rails kind
(`assertion-kinds.ts:367-382`). Custom matchers are already in `TRAILS_MAP`
(`toEqualRuby`, `toBeRubyTruthy`, `toBeRubyFalsy`, `toBeWithinDelta`,
`toBeEmpty`, `toBeExactInstanceOf`, `toRespondTo`: `:263-269`). So most
rewrites keep their kind, and the gate does not need redesign.

It reads the matcher **name only**, so four spellings the table above uses
score the wrong kind and would red the only-shrink `kind` counter in every
gated package:

| spelling                                                       | Rails kind         | scored today |
| -------------------------------------------------------------- | ------------------ | ------------ |
| `toBe(true)` / `toBe(false)` for `assert` / `assert_predicate` | `truthy` / `falsy` | `equal`      |
| `toHaveLength(0)` for `assert_empty`                           | `empty`            | `length`     |
| `toHaveProperty([k])` for `assert_includes` on a Hash          | `includes`         | unmapped     |
| `expect(typeof o.m).toBe("function")` for `assert_respond_to`  | `respondTo`        | `equal`      |

The extractor already emits the matcher's literal first argument in lockstep
(`values`, `extract-ts-core.ts:412-419`), so teaching `buildHistogram` to read
`(kind, value)` pairs for the first three is one small story,
`assertion-kinds-reads-literal-matcher-arguments`, and it lands before any
sweep. The fourth is not taught: the sweeps use `toRespondTo`, which is
already right on both counts. The tooling story also drops the literal `true`
/ `false` from the value comparison once it scores `truthy`/`falsy`, since
those kinds are not value-bearing. It absorbs 0127's
`assert-empty-table-disagrees-with-kind-gate`.

`assertion-receipts.ts` is keyed by the Rails assertion (`kind:
"assert_instance_of"`, re-scored with `as:`), so no receipt changes. A sweep
that finds a receipt now wrong for the new spelling fixes it in the same PR.

### Order of work

1. Tooling, independent and first: `assertion-kinds-reads-literal-matcher-arguments`,
   `vitest-matcher-to-be-kind-of`, `vitest-matchers-to-include-scores-includes`,
   `call-gate-credits-minitest-asserts-as-expect`, then
   `vitest-matchers-readme` (which documents the final set).
2. The 24 `expect-sweep-*` stories, each depending on
   `assertion-kinds-reads-literal-matcher-arguments` and the two matcher
   stories. Each is a whole-file sweep over a measured bin of at most 300 call
   sites (about 600 LOC), smallest blast radius first:
   `expect-sweep-gem-packages`, then activejob, trailties, activemodel,
   activesupport, actionview, activerecord, actionpack.
3. `activesupport-index-drops-minitest-assertion-exports` rewrites the Rails
   bodies to `expect(value, msg)` and deletes the helpers. It depends on every
   sweep and on the call-gate story; then
   `assert-predicate-takes-the-predicate-name-and-builds-minitests-message`.

### Assertions inside ported Rails bodies (decided, owner 2026-10-23)

Rails' testing modules call Minitest assertions in their own bodies. Without a
Minitest port, and with the activesupport helpers deleted, these bodies are
written as below. Sites (trails file:line, measured 2026-10-23 on `704e2fb347`):

| trails file                                                                                                                                                                                 | Rails source                                                                        | Minitest calls in the Ruby body                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `activesupport/src/testing/assertions.ts:310-551` (`assertNot`, `assertRaises`, `assertDifference`, `assertNoDifference`, `assertChanges`, `assertNoChanges`, `_assertNothingRaisedOrWarn`) | `activesupport/lib/active_support/testing/assertions.rb`                            | `assert` 5, `assert_equal` 2, `refute_equal` 1, `assert_nil` 1, `assert_match` 1, `message` 27, `diff` 3, `mu_pp` 1 |
| `activesupport/src/testing/method-call-assertions.ts:102,201`                                                                                                                               | `method_call_assertions.rb`                                                         | `assert_equal` 2, `assert_mock` 1                                                                                   |
| `activesupport/src/testing/error-reporter-assertions.ts:99,112,123`                                                                                                                         | `error_reporter_assertions.rb`                                                      | `assert` 2, `assert_equal` 3, `assert_predicate` 2                                                                  |
| `activesupport/src/testing/deprecation.ts:29,32,48`                                                                                                                                         | `testing/deprecation.rb`                                                            | `assert`, `assert_equal`                                                                                            |
| `activemodel/src/lint.ts` (18 sites, `:8-76`)                                                                                                                                               | `active_model/lint.rb`                                                              | `assert_respond_to`, `assert`, `assert_equal`, `assert_kind_of`                                                     |
| `activerecord/src/testing/query-assertions.ts:59,64,95,100`                                                                                                                                 | `active_record/testing/query_assertions.rb`                                         | `assert`                                                                                                            |
| `actionpack/src/action-dispatch/testing/assertions/routing.ts:198,205,231,234`                                                                                                              | `action_dispatch/testing/assertions/routing.rb`                                     | `assert_equal`, `message`                                                                                           |
| `actionview/src/testing/dom-assertions.ts:20`, `selector-assertions.ts:42,110-113`, `selector-assertions/html-selector.ts:75`                                                               | rails-dom-testing `dom_assertions.rb`, `selector_assertions.rb`, `html_selector.rb` | `assert`, `assert_equal`, `assert_operator`, `diff`                                                                 |
| `activerecord/src/encryption/test-helpers.ts:365-441`                                                                                                                                       | `activerecord/test/cases/encryption/helper.rb`                                      | `assert_equal`, `assert_not_equal`                                                                                  |

The five `activesupport/src/cache/behaviors/*-behavior.ts` files mirror Rails
_test_ support (`activesupport/test/cache/behaviors/`) and are swept like any
test file.

**Ruling (Dean, 2026-10-23):**

1. A ported Rails body that calls a Minitest assert uses plain Vitest `expect`,
   with Rails' message as the second argument. A failed `expect` throws Vitest's
   `AssertionError`, which plays the role of `Minitest::Assertion`.
   - `assert_difference`'s inner `assert_equal` →
     `expect(after, error).toEqual(before + diff)`
   - `assert_no_error_reported`'s `assert_predicate` →
     `expect(reports.isEmpty(), msg).toBe(true)`, or a vitest-matchers matcher
     where Ruby truthiness matters
   - `ActiveModel::Lint::Tests`' `assert_respond_to` →
     `expect(rbObjRespondTo(model, "toKey")).toBe(true)`

   `message { … }` / `diff` / `mu_pp` compositions are inlined as the string
   they build, read off the vendored source (`assertions.rb:57`, `:632`, `:127`); the
   call-gate story credits those three Minitest message builders as inlined,
   the same once-only way. The ActiveSupport assertions
   themselves (`assertDifference`, `assertChanges`, …) keep their Rails names,
   stay ported Rails API, and are called from tests as they are now.

2. **The call gate credits the equivalence once, not per site.**
   `parity:api:calls` reads the same Minitest→`expect` mapping as
   CONTRIBUTING.md § "Porting a Minitest assertion" — the table
   `scripts/test-compare/assertion-kinds.ts` already encodes (`RAILS_MAP` /
   `TRAILS_MAP`) — so `assert_equal` → `expect(…).toEqual` counts as making
   the call. No `@missingRailsCall` receipts, no baseline rows. Story:
   `call-gate-credits-minitest-asserts-as-expect` (assertion-tooling).
3. Rejected: see Alternatives (matcher-recast ActiveSupport assertions;
   module-private helpers).

### What a sweep must not do

- **Never touch a `describe` / `it` string.** Test names are how `parity:test`
  matches, and a regex sweep over `assertEqual(` also hits an `it("assertEqual
…")` title and a sibling `assertEqualRuby(` call (memory "Regex sweeps
  rewrite test titles and sibling calls"). A sweep diff that changes a title
  line is a bug, checked by `git diff -U0 | rg '^\+.*\b(it|describe|test)\('`
  coming back empty of title changes.
- **No added or dropped assertion** inside a name-matched test: the count
  counter is only-shrink. One helper call is one `expect`.
- **Mechanical rows:** `assertMatch`, `assertNoMatch`, `assertSame`,
  `assertNotSame`, `assertInDelta`, `assertInstanceOf`, `assertRespondTo`,
  `assertNotRespondTo`, `assertOperator` (numbers only).
- **Rows that need eyes at every site:** `assert` / `assertPredicate` /
  `assertNotPredicate` (is the value a `boolean`, or can it be `0` / `""`?),
  `assertEqual` / `assertNotEqual` (does either side define Ruby `==`?),
  `assertNil` / `assertNotNil` (which JS nil does the port produce?),
  `assertEmpty` / `assertIncludes` (is the collection async, a `Map`, a
  Hash?), `assertKindOf` (primitive?).

## Non-goals

- **Porting Minitest**, as a package or otherwise. Rejected by the repo owner
  (2026-10-23). `vendor/minitest/v5.27.0/` is reference, with `compareApi` and
  `compareTests` both `false` in `vendor/sources.ts`.
- **The `ActiveSupport::Testing::Assertions` half.** Ported Rails API at its
  Rails names; it stays (memory "Assert helper home is as testing assertions
  not minitest").
- **The runner classes and `Mock` / `stub`.** See § Design, "Out of scope".
- **A `toBeNil` matcher.** Ruled out by the repo owner (2026-10-22).
- **Changing CONTRIBUTING.md's table.** Ratified. The sweeps follow it; the
  two matcher stories add rows to it, they do not change existing ones.

## Alternatives considered

- **Recast the ActiveSupport assertions as Vitest matchers**
  (`expect(fn).toChange(...)` for `assert_difference` / `assert_changes`).
  Rejected by the repo owner (2026-10-23): it drops the Rails names.
- **Module-private `assertEqual`-style helpers** in each Rails-mirroring file,
  so the call gates credit the call by name. Rejected by the repo owner
  (2026-10-23): it is the Minitest port again under another name.
- **Per-call `@missingRailsCall … PERMANENT` receipts** (about 90). Rejected
  (2026-10-23): the gate credits the mapping once instead.

- **Port Minitest as its own package (`@blazetrails/minitest`), enrolled in
  `parity:api`, with ported Rails bodies importing from it.** This RFC's first
  draft (2026-10-22). **Rejected by the repo owner 2026-10-23**: Minitest is
  vendored for reference, not ported. Its stories
  (`minitest-package-ports-assertions-rb`, `-mock`, `-runner-classes`,
  `ported-rails-assertion-modules-import-minitest`) are closed `FALSIFIED`.
- **Keep the Minitest half in activesupport, unexported from the index.**
  Leaves uncredited `@noRailsEquivalent` surface in a file that mirrors a
  different `.rb`, and a second assertion library beside Vitest's. Rejected
  (2026-10-22).
- **"No new matcher".** The first draft held the seven existing matchers
  sufficient. Re-measured against Rails' usage (464 `assert_kind_of`, 700
  `assert_includes`), two gaps remain; see § "Matchers".
- **Per-helper sweeps across the tree.** Each file touched up to a dozen times.
  Whole-file, per-package bins touch each file once.

## Rollout

1. Tooling — `assertion-kinds-reads-literal-matcher-arguments`,
   `vitest-matcher-to-be-kind-of`, `vitest-matchers-to-include-scores-includes`,
   `call-gate-credits-minitest-asserts-as-expect`, `vitest-matchers-readme`
2. Sweeps — `expect-sweep-gem-packages`, `expect-sweep-activejob`,
   `expect-sweep-trailties`, `expect-sweep-activemodel-1`, `-2`,
   `expect-sweep-activesupport-1`, `-2`, `expect-sweep-actionview-1`, `-2`,
   `expect-sweep-activerecord-1` … `-5`, `expect-sweep-actionpack-1` … `-10`
3. Close-out —
   `activesupport-index-drops-minitest-assertion-exports`,
   `assert-predicate-takes-the-predicate-name-and-builds-minitests-message`

## Verification

- The import-resolved count in § Measurements reaches **0 call sites in 0 test
  files** (from 5,938 in 392).
- `packages/activesupport/src/testing/assertions.ts` exports only the Rails
  members listed in § Design, and none of the 22 Minitest helper names or
  `diff` / `message` is exported from `@blazetrails/activesupport`.
- No `packages/minitest` exists, and `vendor/sources.ts` has `compareApi:
false` for minitest.
- `pnpm parity:api:calls` / `parity:api:calls:args` green after the close-out,
  through `call-gate-credits-minitest-asserts-as-expect`, with no new receipt
  or baseline row.
- `pnpm parity:test:assertions` green at every step, with the `kind` counter
  never rising.

## Open questions

1. **The Minitest runner classes in activesupport** (`Assertion`, `Skip`,
   `UnexpectedError`, `BacktraceFilter`, `Test`, `Minitest`, `Mock`, `stub`).
   They are a partial Minitest port that `ActiveSupport::TestCase` (`< Minitest::Test`)
   and `autorun.ts` stand on. Under the 2026-10-23 ruling they are presumably
   to go too, onto Vitest's runner; that is a larger change than this RFC and
   needs its own RFC if Dean wants it. Not filed.
2. **RFC 0158's nil/kind-of drafts** (`assert-nil-sweep-activerecord-*`,
   `assert-nil-to-be-undefined-ports`, `shared-assert-kind-of-helper`) move
   test code toward helpers this RFC deletes. Recommendation: close as
   superseded when this RFC is activated. 0127's
   `assert-empty-table-disagrees-with-kind-gate` is absorbed by
   `assertion-kinds-reads-literal-matcher-arguments`.

## Changelog

- 2026-10-23 — Owner ruled on assertions inside ported Rails bodies: plain
  `expect(value, msg)`, credited once by the call gate; added
  `call-gate-credits-minitest-asserts-as-expect`; matcher-recast and
  module-private-helper alternatives recorded as rejected.

- 2026-10-23 — Rewritten after the owner ruled Minitest is vendored for
  reference, not ported. Dropped the `@blazetrails/minitest` package and its
  cluster (four stories closed `FALSIFIED`); dropped the "reverses RFC 0098"
  framing; added § "Matchers" (two matcher stories), § "Assertions inside ported Rails bodies", and
  the deletion close-out; RFC 0158's overlapping sweeps and deletion closed as
  superseded, `assert-predicate-takes-…` rehomed here.
- 2026-10-22 — First draft (package port).
