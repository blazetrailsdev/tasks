---
rfc: "0206-minitest-port-and-assertions-to-expect"
title: "Port minitest as its own package, and move test code onto Vitest expect"
status: active
created: 2026-10-22
updated: 2026-10-23
owner: "@deanmarano"
packages:
  - minitest
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
clusters:
  - minitest-package
  - assertion-tooling
  - expect-sweeps
---

# RFC 0206 — Port minitest as its own package, and move test code onto Vitest expect

## Summary

`packages/activesupport/src/testing/assertions.ts` holds two things in one
file: Rails' `ActiveSupport::Testing::Assertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb`)
and a port of most of `Minitest::Assertions`, `Minitest::Test` and the
`Minitest` runner classes (`vendor/minitest/v5.27.0/lib/minitest.rb`,
`lib/minitest/assertions.rb`, `lib/minitest/test.rb`). Test code across ten
packages calls the Minitest half: 5,938 call sites in 392 test files.

This RFC does two things, by repo-owner ruling (2026-10-22):

1. **Minitest becomes `@blazetrails/minitest`**, a gem port mirroring
   `vendor/minitest/v5.27.0/lib`, enrolled in `parity:api`. The
   Minitest members leave activesupport and lose their
   `@noRailsEquivalent PERMANENT` receipts. Ported Rails code whose Ruby body
   calls a Minitest assertion (`assert_difference` calls `assert_equal`;
   `ActiveModel::Lint::Tests` calls `assert_respond_to`) imports it from there,
   so the call gates keep crediting those calls. This reverses RFC 0098's
   closed `map-vendored-minitest-and-drop-norailsequivalent` (won't-do,
   2026-08-14), whose closing note asked for a fresh story if the decision
   changed.
2. **Test code stops calling Minitest helpers and uses Vitest `expect`**, by
   CONTRIBUTING.md § "Porting a Minitest assertion": the built-in matcher by
   default, a `@blazetrails/vitest-matchers` matcher only where the built-in
   gives the wrong answer for the value under test. The existing seven
   matchers cover every gap measured below, so **no new matcher is minted**.
   Ruby `nil` maps onto the JS value the port actually produces (`null` or
   `undefined`) rather than onto a `toBeNil` matcher.

When it is done, `testing/assertions.ts` is the ported Rails file and nothing
else, `@blazetrails/minitest` is the ported gem, and no `*.test.ts` file
imports a Minitest assertion.

## Motivation

The CONTRIBUTING.md table is ratified, and the tree does not follow it.
RFC 0158 (`minitest-builtin-asserts-port-as-expect`, done) wrote the table and
filed three caller sweeps plus a deletion
(`minitest-asserts-to-expect-activesupport-callers`,
`-trailties-callers`, `-actionpack-actionview-callers`,
`delete-minitest-builtin-assert-helpers`). Since then the helpers spread
through the `@blazetrails/activesupport` index into activerecord, activemodel,
activejob, globalid, arel and rack-test, which no sweep covers, and the usage
grew several-fold (`assertPredicate`: 22 files then, 99 now).

The deletion story cannot land as written either. Rails' own testing modules
call Minitest built-ins inside their bodies (measured below), so deleting
`assert`, `assertEqual`, `assertNil`, `assertMatch`, `assertPredicate`,
`message` or `diff` would force the ported Rails bodies to drop calls their
Ruby makes, which `parity:api:calls` reports as missing. A real home for
Minitest is what lets the test-code half go away while the Rails half keeps its
calls.

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
`_assertNothingRaisedOrWarn`, `_callableToSourceString`, and `UNTRACKED`.
These are `ActiveSupport::Testing::Assertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb:21-252`),
and `parity:api` matches the file against that `.rb`. Likewise
`MethodCallAssertions` (`method_call_assertions.rb:9-64`) and
`ErrorReporterAssertions` (`error_reporter_assertions.rb:62,88`) are Rails
files and stay, minus the Minitest pieces that sit in them today (`Mock`,
`MockExpectationError`, `stub`, `assertMock`: `vendor/minitest/v5.27.0/lib/minitest/mock.rb:10,241,286`).
The `assert_not_*` aliases `ActiveSupport::TestCase` declares
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:164-296`)
stay as `TestCase` statics, now pointing at `@blazetrails/minitest`.

**Moves to `@blazetrails/minitest`:** every Minitest member, at the file that
mirrors its `.rb`:

| Ruby                                                                                                             | Ruby file                    | trails today                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `Minitest::Assertions` (`assert` `:171` … `refute` `:650`, `message` `:632`, `diff` `:57`)                       | `lib/minitest/assertions.rb` | `activesupport/src/testing/assertions.ts:540-1016`                 |
| `Assertion` `:1035`, `Skip` `:1065`, `UnexpectedError` `:1074`, `BacktraceFilter` `:1190`, the `Minitest` module | `lib/minitest.rb`            | `activesupport/src/testing/assertions.ts:33-300`                   |
| `Minitest::Test`                                                                                                 | `lib/minitest/test.rb:10`    | `activesupport/src/testing/assertions.ts` (`Test`)                 |
| `Minitest::Mock`, `Object#stub`, `assert_mock`                                                                   | `lib/minitest/mock.rb`       | `activesupport/src/testing/method-call-assertions.ts:5-90,248-325` |

Rails' modules call these Minitest members from their Ruby bodies, which is
why they cannot simply be deleted: `assertions.rb` calls `assert` (5),
`assert_equal` (2), `refute_equal` (1), `assert_nil` (1), `assert_match` (1),
`message` (27), `diff` (3), `mu_pp` (1); `method_call_assertions.rb` calls
`assert_equal` (2) and `assert_mock` (1); `error_reporter_assertions.rb` calls
`assert` (2), `assert_equal` (3) and `assert_predicate` (2). Eleven other
non-test files that mirror Rails assertion modules call them too:
`actionpack/src/action-dispatch/testing/assertions/routing.ts`,
`actionview/src/testing/selector-assertions.ts`,
`actionview/src/testing/selector-assertions/html-selector.ts`,
`actionview/src/testing/dom-assertions.ts`, `activemodel/src/lint.ts`,
`activerecord/src/testing/query-assertions.ts`,
`activerecord/src/encryption/test-helpers.ts`, and five
`activesupport/src/cache/behaviors/*-behavior.ts`. They switch their import to
`@blazetrails/minitest` and keep every call.

### Per-helper disposition

For test code only; ported Rails code keeps calling the Minitest port. Three
dispositions: **built-in** (a Vitest matcher means the same for every value it
is used on), **existing matcher** (the built-in is wrong for some values and a
`@blazetrails/vitest-matchers` matcher already covers them), **delete** (the
test-facing export goes away). No row needs a new matcher. "Gate" is the
`parity:test:assertions` kind the rewrite scores, against the kind
`scripts/test-compare/assertion-kinds.ts` gives the Rails assertion.

| helper                                                                        | files | calls | disposition               | replacement                                                                                                                                                          | why the Ruby semantics do not bite                                                                                                                                                                                                                                                                                                                                                                                                       | gate                                                                                                                                              |
| ----------------------------------------------------------------------------- | ----: | ----: | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assertEqual`                                                                 |   129 | 2,136 | built-in + existing       | `toEqual(exp)`; `toBe(exp)` for a primitive; `toEqualRuby(exp)` where either side defines Ruby `==` (records, `Duration`, `BigDecimal`, `Time`, ruby-compat `Hash`)  | The helper is `rbEqual` (`assertions.ts:880`, minitest `assertions.rb:220`). `toEqual` agrees on primitives, Arrays, plain objects and Map contents (probe: a filled `Map` is not `toEqual` an empty one). It disagrees where Ruby `==` is a method: it ignores class (probe: `new A()` with `x = 1` `toEqual` `{ x: 1 }` passes), ignores `undefined` properties, and compares a record field by field where `==` compares class and id | `equal` → `equal` (`toBe` is `equal` too)                                                                                                         |
| `assertNotEqual`                                                              |    14 |    49 | built-in + existing       | `.not.toEqual` / `.not.toEqualRuby`                                                                                                                                  | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEqual` → `notEqual`                                                                                                                           |
| `assertPredicate`                                                             |    99 |   903 | built-in + existing       | boolean-typed predicate: `expect(o.isFoo()).toBe(true)`; value-returning predicate: `expect(o.foo()).toBeRubyTruthy()`                                               | Minitest's is `assert o1.__send__ op` (`assertions.rb:394`): Ruby truthiness. For a `boolean` value `toBe(true)` is exact; a value that can be `0` or `""` needs Ruby truthiness                                                                                                                                                                                                                                                         | `truthy` → **`equal` today for `toBe(true)`**; `truthy` once `assertion-kinds-reads-literal-matcher-arguments` lands. `toBeRubyTruthy` → `truthy` |
| `assertNotPredicate`                                                          |    56 |   377 | built-in + existing       | `toBe(false)` / `toBeRubyFalsy()`                                                                                                                                    | as above; `toBeFalsy` wrongly passes on `0`                                                                                                                                                                                                                                                                                                                                                                                              | `falsy` → **`equal` today**; `falsy` after the tooling story                                                                                      |
| `assert`                                                                      |    94 |   560 | built-in + existing       | `toBe(true)` for a boolean; `toBeTruthy()` where the value cannot be `0`, `""` or `NaN`; else `toBeRubyTruthy()`                                                     | `assert` is `test` truthiness (`assertions.rb:171`)                                                                                                                                                                                                                                                                                                                                                                                      | `truthy` → `truthy` (`toBe(true)`: as `assertPredicate`)                                                                                          |
| `assertNil`                                                                   |   107 |   407 | built-in                  | `toBeNull()` where the port produces `null`; `toBeUndefined()` where it produces `undefined`                                                                         | Ruby has one `nil`. Map it onto the one JS value the port returns. A value that can be both is a port with two nils: converge the source or file it, do not hide it in the assertion. (Probe: `toBeNull` fails on `undefined`, as it should)                                                                                                                                                                                             | `nil` → `nil` (both)                                                                                                                              |
| `assertNotNil`                                                                |    18 |    58 | built-in                  | `.not.toBeNull()` where the domain is `null \| T`; `toBeDefined()` where it is `undefined \| T`                                                                      | as above. `.not.toBeNull()` passes on `undefined` (probe), so it is only right where `undefined` cannot occur                                                                                                                                                                                                                                                                                                                            | `notNil` → `notNil` (both)                                                                                                                        |
| `assertMatch`                                                                 |    42 |   514 | built-in                  | `expect(s).toMatch(m)`                                                                                                                                               | A string `m` is a literal in both (the helper escapes it, `assertions.ts:977`; probe: `toMatch(".")` on `"ab"` fails). The helper returns the `MatchData`; a call site that uses the result reads `m.exec(s)` itself                                                                                                                                                                                                                     | `match` → `match`                                                                                                                                 |
| `assertNoMatch`                                                               |    13 |    57 | built-in                  | `.not.toMatch(m)`                                                                                                                                                    | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `noMatch` → `noMatch`                                                                                                                             |
| `assertEmpty`                                                                 |    81 |   271 | built-in + existing       | `toHaveLength(0)` where the receiver has `length`; `toBeEmpty()` for `Map`, `Set`, a Hash or an `isEmpty` object                                                     | The helper calls `isEmpty` (`assertions.ts:649`). An async `isEmpty` (a `Relation`) returns a Promise, and `toBeEmpty` on a Promise fails (probe): `await` the collection's answer first                                                                                                                                                                                                                                                 | `empty` → **`length` today for `toHaveLength(0)`**; `empty` after the tooling story. `toBeEmpty` → `empty`                                        |
| `assertNotEmpty`                                                              |    37 |    93 | built-in + existing       | `.not.toHaveLength(0)` / `.not.toBeEmpty()`                                                                                                                          | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEmpty` → `notEmpty` (after the tooling story for `toHaveLength`)                                                                              |
| `assertRespondTo`                                                             |    49 |   171 | existing                  | `toRespondTo("m")`                                                                                                                                                   | CONTRIBUTING's built-in is `expect(typeof o.m).toBe("function")`, which misses a name answered by `respond_to_missing?` and scores `equal`, never `respondTo`. `toRespondTo` is `rbObjRespondTo` and scores `respondTo`, so it is the one spelling that both answers right and keeps the kind                                                                                                                                            | `respondTo` → `respondTo`                                                                                                                         |
| `assertNotRespondTo`                                                          |    31 |   104 | existing                  | `.not.toRespondTo("m")`                                                                                                                                              | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notRespondTo` → `notRespondTo`                                                                                                                   |
| `assertIncludes`                                                              |    24 |    79 | built-in                  | Array: `toContainEqual(o)` (or `toContain` for a primitive); String / Set: `toContain(o)`; Hash key: `toHaveProperty([k])`; `Map` key: `expect(m.has(k)).toBe(true)` | Minitest is `collection.include?(o)` (`assertions.rb:260`): `Array#include?` uses `==`, so a record element needs `toContainEqual` with care or `toEqualRuby` over a found element; `toContain` on a `Map` does not look at keys (probe)                                                                                                                                                                                                 | `includes` → `includes`; `toHaveProperty` **unmapped today**, `includes` after the tooling story                                                  |
| `assertNotIncludes`                                                           |    11 |    19 | built-in                  | `.not.` of the above                                                                                                                                                 | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `excludes` → `excludes`                                                                                                                           |
| `assertKindOf`                                                                |    17 |    53 | built-in + existing       | object: `toBeInstanceOf(cls)`; primitive: `toBeExactInstanceOf(String)` / `(Number)`                                                                                 | The helper boxes (`Object(obj) instanceof cls`, `assertions.ts:953`); `toBeInstanceOf(String)` on `"x"` fails (probe). A primitive's `constructor` is its wrapper class, so the exact matcher is right there                                                                                                                                                                                                                             | `kindOf` → `kindOf` / `instanceOf` (folded together today by `HISTOGRAM_FOLD`)                                                                    |
| `assertNotKindOf`                                                             |     1 |     5 | built-in                  | `.not.toBeInstanceOf(cls)`                                                                                                                                           | as above; Minitest's `refute_kind_of`                                                                                                                                                                                                                                                                                                                                                                                                    | no mapped kind either side (`NEGATION` has no `kindOf` entry, `RAILS_MAP` no `refute_kind_of`): unchanged                                         |
| `assertInstanceOf`                                                            |     8 |    20 | existing                  | `toBeExactInstanceOf(cls)`                                                                                                                                           | `instance_of?` is the exact class (`assertions.rb:271`); `toBeInstanceOf` admits subclasses                                                                                                                                                                                                                                                                                                                                              | `instanceOf` → `instanceOf`                                                                                                                       |
| `assertSame`                                                                  |    20 |    41 | built-in                  | `toBe(exp)`                                                                                                                                                          | `equal?` is identity; `Object.is` is identity for objects. Strings are primitives in trails (CLAUDE.md § "Ruby Strings are JS string primitives"), so two equal Ruby Strings that are different objects are one JS value: ratified                                                                                                                                                                                                       | `same` → `equal`, folded together by `HISTOGRAM_FOLD`                                                                                             |
| `assertNotSame`                                                               |     4 |     6 | built-in                  | `.not.toBe(exp)`                                                                                                                                                     | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notSame` → `notEqual`, folded                                                                                                                    |
| `assertInDelta`                                                               |     8 |    12 | existing                  | `toBeWithinDelta(exp, delta)`                                                                                                                                        | `toBeCloseTo`'s digit count cannot say "within 0.001"                                                                                                                                                                                                                                                                                                                                                                                    | `inDelta` → `inDelta`                                                                                                                             |
| `assertOperator`                                                              |     2 |     3 | built-in                  | `toBeGreaterThan` / `toBeLessThan` / `…OrEqual`                                                                                                                      | All three sites compare numbers. A Comparable non-number (`Time`, `Duration`) would need `expect(a.compareTo(b))…`; none exists today                                                                                                                                                                                                                                                                                                    | `operator` → `operator`                                                                                                                           |
| `diff`, `message`                                                             |   n/a |   n/a | delete from activesupport | move to `@blazetrails/minitest` (`assertions.rb:57,632`)                                                                                                             | machinery; test code never calls them                                                                                                                                                                                                                                                                                                                                                                                                    | n/a                                                                                                                                               |
| `Assertion`, `Skip`, `UnexpectedError`, `BacktraceFilter`, `Test`, `Minitest` |   n/a |   n/a | delete from activesupport | move to `@blazetrails/minitest`                                                                                                                                      | read by `testing/autorun.ts`, `test-case.ts`, `setup-and-teardown.ts`, `tests-without-assertions.ts`, which import them from the new package                                                                                                                                                                                                                                                                                             | n/a                                                                                                                                               |
| `_takeAssertions`                                                             |   n/a |   n/a | moves                     | `@blazetrails/minitest` (the `assertions` counter, `assertions.rb` `self.assertions`)                                                                                | the counter lives with `assert`                                                                                                                                                                                                                                                                                                                                                                                                          | n/a                                                                                                                                               |

Bucket counts over the 22 test-facing helpers: **built-in 10**
(`assertNil`, `assertNotNil`, `assertMatch`, `assertNoMatch`,
`assertIncludes`, `assertNotIncludes`, `assertNotKindOf`, `assertSame`,
`assertNotSame`, `assertOperator`), **built-in by default with an existing
matcher fallback 8** (`assertEqual`, `assertNotEqual`, `assertPredicate`,
`assertNotPredicate`, `assert`, `assertEmpty`, `assertNotEmpty`,
`assertKindOf`), **existing matcher always 4** (`assertRespondTo`,
`assertNotRespondTo`, `assertInstanceOf`, `assertInDelta`), **new matcher 0**.
Every helper is then deleted from the activesupport surface; none is deleted
from the codebase, because the Minitest port keeps them for ported Rails code.

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

Moving the Minitest helpers to a new package does not change what the
extractor records: `isAssertionCallee` matches by name, not import path.

### `@blazetrails/minitest`

A new workspace package mirroring `vendor/minitest/v5.27.0/lib`. It depends on
`@blazetrails/ruby-compat` only; activesupport depends on it. Because it sits
below activesupport, it also gives the gem ports activesupport cannot import
(`i18n`, `date`, `ruby-compat`) a Minitest to call, which RFC 0158's
`assert-nil-helper-home-below-activesupport-for-gem-ports` asks for.

Its `vendor/sources.ts` entry flips `compareApi` to `true` (`compareTests`
stays `false`: Minitest's own suite is not ported). Members lose their
`@noRailsEquivalent PERMANENT` receipts as `parity:api` starts crediting them.
A new package needs the registrations in the memory note
"New package needs ci yml and guard fixture" and, for each subpath another
package imports, "New package subpath needs four registrations".

### Order of work

1. `minitest-package-ports-assertions-rb` — the package, its enrollment, and
   `Minitest::Assertions` moved in.
2. `minitest-package-ports-runner-classes` and `minitest-package-ports-mock`
   (parallel, non-overlapping files).
3. `ported-rails-assertion-modules-import-minitest` — the eleven Rails-mirroring
   files and activesupport's Rails half import from the new package.
4. `assertion-kinds-reads-literal-matcher-arguments` and
   `vitest-matchers-readme` (independent of 1–3; may land first).
5. The 24 `expect-sweep-*` stories, each depending on step 4's tooling story.
   Each is a whole-file sweep over a measured bin of at most 300 call sites
   (about 600 LOC), smallest blast radius first: `expect-sweep-gem-packages`,
   then activejob, trailties, activemodel, activesupport, actionview,
   activerecord, actionpack.
6. `activesupport-index-drops-minitest-assertion-exports` — depends on every
   sweep and on step 3.

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

- **The `ActiveSupport::Testing::Assertions` half.** Ported Rails API at its
  Rails names, matched by `parity:api` against `assertions.rb`; it stays where
  it is (memory "Assert helper home is as testing assertions not minitest").
- **`stub` / `Mock` call sites in tests.** `Object#stub` and `Minitest::Mock`
  are Minitest API with no CONTRIBUTING.md row and no Vitest twin of the same
  meaning; they move to `@blazetrails/minitest` and their 11 + 3 test files
  keep calling them.
- **Porting Minitest's own test suite** (`compareTests: false`).
- **A `toBeNil` matcher.** Ruled out by the repo owner (2026-10-22): `nil` maps
  to the JS value the port produces.
- **Changing CONTRIBUTING.md's table.** Ratified. The gate is taught to agree
  with it, not the other way round.

## Alternatives considered

- **Keep the Minitest half in activesupport, unexported from the index.** It
  would let tests stop importing it without a new package, but leaves the
  members as uncredited `@noRailsEquivalent` surface in a file that mirrors a
  different `.rb`, and still gives `i18n` / `date` no Minitest to call.
  Rejected by the repo owner (2026-10-22).
- **Delete the Minitest helpers (RFC 0158's
  `delete-minitest-builtin-assert-helpers`).** Breaks the ported Rails bodies
  that call them; see § Design.
- **A `toBeNil` matcher** for `assert_nil`'s `null`/`undefined` pair. Ruled
  out; see Non-goals.
- **Per-helper sweeps across the tree.** Each file would be touched up to a
  dozen times and every PR would cross packages. Whole-file, per-package bins
  touch each file once.

## Rollout

1. Package — `minitest-package-ports-assertions-rb`,
   `minitest-package-ports-runner-classes`, `minitest-package-ports-mock`,
   `ported-rails-assertion-modules-import-minitest`
2. Tooling — `assertion-kinds-reads-literal-matcher-arguments`,
   `vitest-matchers-readme`
3. Sweeps — `expect-sweep-gem-packages`, `expect-sweep-activejob`,
   `expect-sweep-trailties`, `expect-sweep-activemodel-1`, `-2`,
   `expect-sweep-activesupport-1`, `-2`, `expect-sweep-actionview-1`, `-2`,
   `expect-sweep-activerecord-1` … `-5`, `expect-sweep-actionpack-1` … `-10`
4. Close-out — `activesupport-index-drops-minitest-assertion-exports`

## Verification

- The import-resolved count in § Measurements reaches **0 call sites in 0 test
  files** (from 5,938 in 392).
- `rg -l '@noRailsEquivalent PERMANENT' packages/activesupport/src/testing/assertions.ts`
  is empty (35 tags today).
- `packages/activesupport/src/testing/assertions.ts` exports only the eleven
  Rails members listed in § Design.
- `pnpm parity:api` credits the Minitest members to `packages/minitest`.
  activesupport is not in `parity:api:extra:gate` (it has no row in
  `scripts/api-compare/extra-surface-mark.json` and is in neither
  `TAGGED_ONLY_PACKAGES` nor `ROWLESS_PACKAGES`), so there is no mark to
  tighten. Its measured `pnpm parity:api:extra --package activesupport` total
  is **764** today (185 novel, 579 moved); `testing/assertions.ts` contributes
  24 of them (10 novel, 14 moved, every one a Minitest name: `assertEqual`,
  `assertEmpty`, `diff`, `message`, `filterBacktrace`, …) and
  `testing/method-call-assertions.ts` 1. When the Minitest half has moved, the
  total reads **739**, and those names are scored in `packages/minitest`
  against `vendor/minitest` instead. The 35 `PERMANENT`-receipted members are
  subtracted today, so they do not move the activesupport figure either way.
- `pnpm parity:test:assertions` green at every step, with the `kind` counter
  never rising.

## Open questions

1. **Package layout of `minitest.rb` versus `lib/minitest/*.rb`.** The vendored
   `libPath` is `lib/minitest`, which leaves `lib/minitest.rb` (the runner
   classes) outside it. Recommendation: widen `libPath` to `lib` so
   `minitest.rb` maps to `packages/minitest/src/minitest.ts`, the way the other
   gem ports map their top-level file. Decided in
   `minitest-package-ports-assertions-rb`.
2. **RFC 0158's overlapping drafts.** `minitest-asserts-to-expect-activesupport-callers`,
   `-trailties-callers`, `-actionpack-actionview-callers` and
   `delete-minitest-builtin-assert-helpers` are superseded by this RFC's sweeps
   and close-out; `assert-nil-sweep-activerecord-a-to-h`, `-associations-and-adapters`,
   `-i-to-z`, `-to-be-undefined-ports` and `shared-assert-kind-of-helper` move
   test code toward the helpers this RFC removes; 0127's
   `assert-empty-table-disagrees-with-kind-gate` is absorbed by
   `assertion-kinds-reads-literal-matcher-arguments`. Recommendation: the repo
   owner closes them as superseded when this RFC is activated.

## Changelog

- 2026-10-22: initial RFC
