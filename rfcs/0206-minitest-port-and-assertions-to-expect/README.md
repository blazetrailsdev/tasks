---
rfc: "0206-minitest-port-and-assertions-to-expect"
title: "Minitest is reference only: test code and ported Rails assertion bodies use Vitest expect"
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
clusters:
  - rails-bodies
  - assertion-tooling
  - expect-sweeps
priority: 2
---

# RFC 0206 — Minitest is reference only: test code and ported Rails assertion bodies use Vitest expect

## Summary

`packages/activesupport/src/testing/assertions.ts` holds two things in one
file: Rails' `ActiveSupport::Testing::Assertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb`)
and a hand port of most of `Minitest::Assertions`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb`). Test code across ten
packages calls the Minitest half: 5,938 call sites in 392 test files.

By repo-owner ruling (2026-10-23), **Minitest is not ported.** It stays
vendored at `vendor/minitest/v5.27.0/` as reference for porters: what each
`assert_*` checks, and what its failure says. It gets no package, no
`parity:api` enrollment, and RFC 0098's won't-do on
`map-vendored-minitest-and-drop-norailsequivalent` stands. Vitest is the test
framework, and its `expect` is the assertion API.

This RFC does three things:

1. **Test code stops calling Minitest helpers and uses Vitest `expect`**, by
   CONTRIBUTING.md § "Porting a Minitest assertion": the built-in matcher by
   default, a `@blazetrails/vitest-matchers` matcher where the built-in gives
   the wrong answer for the value under test. `@blazetrails/vitest-matchers`
   exists to make porting a Minitest or Rails assertion easy and faithful
   (Ruby truthiness, Ruby `==`, exact class, `respond_to?`, delta).
2. **Ported Rails bodies that call a Minitest assert call `expect` too**
   (owner ruling, 2026-10-23; § "Minitest asserts inside ported Rails
   bodies"), and the call gate credits `assert_equal` → `expect().toEqual` once,
   from the same table, instead of a receipt at each site.
3. **The Minitest half of `testing/assertions.ts` is deleted**, leaving the
   Rails file and nothing else.

When it is done, no source file in the repo defines or imports a Minitest
assertion helper.

## Motivation

The CONTRIBUTING.md table is ratified, and the tree does not follow it.
RFC 0158 (`minitest-builtin-asserts-port-as-expect`, done) wrote the table and
filed caller sweeps plus a deletion. Since then the helpers spread through the
`@blazetrails/activesupport` index into activerecord, activemodel, activejob,
globalid, arel and rack-test, and the usage grew several-fold
(`assertPredicate`: 22 files then, 99 now).

The deletion could not land as written, because Rails' own testing modules
call Minitest built-ins inside their bodies (measured below), and deleting the
helpers would leave those bodies with nothing to call. That is the question
this RFC settles: those bodies call `expect`, and the call gate knows that an
`expect` chain is the port of a Minitest assert.

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

### Minitest asserts inside ported Rails bodies

Ruled by the repo owner on 2026-10-23.

Rails' testing modules call Minitest from their Ruby bodies:
`assertions.rb` calls `assert` (5), `assert_equal` (2), `refute_equal` (1),
`assert_nil` (1), `assert_match` (1), `message` (27), `diff` (3), `mu_pp` (1);
`method_call_assertions.rb` calls `assert_equal` (2) and `assert_mock` (1);
`error_reporter_assertions.rb` calls `assert` (2), `assert_equal` (3) and
`assert_predicate` (2). Eleven other non-test files that mirror Rails
assertion modules call them too:
`actionpack/src/action-dispatch/testing/assertions/routing.ts`,
`actionview/src/testing/selector-assertions.ts`,
`actionview/src/testing/selector-assertions/html-selector.ts`,
`actionview/src/testing/dom-assertions.ts`, `activemodel/src/lint.ts`,
`activerecord/src/testing/query-assertions.ts`,
`activerecord/src/encryption/test-helpers.ts`, and five
`activesupport/src/cache/behaviors/*-behavior.ts`.

**Each such call is written as Vitest `expect`, the same spelling a test
uses, chosen by the per-helper table below.** A failed `expect` throws an
`AssertionError`, which is the role `Minitest::Assertion` plays: it fails the
running `it`, and it propagates out of the Rails method unchanged. The Minitest
`msg` argument is `expect`'s second argument, which Vitest prefixes to the
failure text as Minitest prefixes `msg`:

```ts
// assert_difference: assert_equal(before + diff, after, error)
expect(after, error).toEqual(before + diff);
// assert_no_error_reported: assert_predicate(reports, :empty?, msg)
expect(reports, msg).toHaveLength(0);
// ActiveModel::Lint::Tests: assert_respond_to(model, :to_key)
expect(model).toRespondTo("toKey");
```

Minitest's message machinery (`message`, `diff`, `mu_pp`) has no separate
port. Where a Rails body builds a message with `message(msg) { ... }`, the
string is built in place (`rbInspect` where Ruby's `mu_pp` inspects) and
handed to `expect`.

The Rails methods themselves (`assertDifference`, `assertChanges`,
`assertRaises`, `assertQueries`, `assertSelect`, …) keep their Rails names and
stay ported Rails API, called from tests exactly as now.

**The call gate credits the equivalence once.** A Rails body that calls
`assert_equal` and a TS body that calls `expect(...).toEqual` is not a missing
call. `parity:api:calls` reads the same Minitest → matcher mapping as
CONTRIBUTING.md § "Porting a Minitest assertion" and
`scripts/test-compare/assertion-kinds.ts` (one table, not two), and counts an
`expect` chain ending in a mapped matcher as making the Minitest call. Minitest's
message machinery (`message`, `diff`, `mu_pp`) is credited by the same
mapping as folded into `expect`'s message argument. No `@missingRailsCall`
receipt and no baseline row is written for any of these. That is story
`call-gate-credits-minitest-asserts-as-expect`, and it lands before the bodies
are converted.

### Per-helper disposition

For test code, and for the ported Rails bodies in § "Minitest asserts inside ported Rails bodies". Three
dispositions: **built-in** (a Vitest matcher means the same for every value it
is used on), **existing matcher** (the built-in is wrong for some values and a
`@blazetrails/vitest-matchers` matcher already covers them), **delete** (the
test-facing export goes away). No row needs a new matcher. "Gate" is the
`parity:test:assertions` kind the rewrite scores, against the kind
`scripts/test-compare/assertion-kinds.ts` gives the Rails assertion.

| helper               | files | calls | disposition         | replacement                                                                                                                                                          | why the Ruby semantics do not bite                                                                                                                                                                                                                                                                                                                                                                                                       | gate                                                                                                                                              |
| -------------------- | ----: | ----: | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assertEqual`        |   129 | 2,136 | built-in + existing | `toEqual(exp)`; `toBe(exp)` for a primitive; `toEqualRuby(exp)` where either side defines Ruby `==` (records, `Duration`, `BigDecimal`, `Time`, ruby-compat `Hash`)  | The helper is `rbEqual` (`assertions.ts:880`, minitest `assertions.rb:220`). `toEqual` agrees on primitives, Arrays, plain objects and Map contents (probe: a filled `Map` is not `toEqual` an empty one). It disagrees where Ruby `==` is a method: it ignores class (probe: `new A()` with `x = 1` `toEqual` `{ x: 1 }` passes), ignores `undefined` properties, and compares a record field by field where `==` compares class and id | `equal` → `equal` (`toBe` is `equal` too)                                                                                                         |
| `assertNotEqual`     |    14 |    49 | built-in + existing | `.not.toEqual` / `.not.toEqualRuby`                                                                                                                                  | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEqual` → `notEqual`                                                                                                                           |
| `assertPredicate`    |    99 |   903 | built-in + existing | boolean-typed predicate: `expect(o.isFoo()).toBe(true)`; value-returning predicate: `expect(o.foo()).toBeRubyTruthy()`                                               | Minitest's is `assert o1.__send__ op` (`assertions.rb:394`): Ruby truthiness. For a `boolean` value `toBe(true)` is exact; a value that can be `0` or `""` needs Ruby truthiness                                                                                                                                                                                                                                                         | `truthy` → **`equal` today for `toBe(true)`**; `truthy` once `assertion-kinds-reads-literal-matcher-arguments` lands. `toBeRubyTruthy` → `truthy` |
| `assertNotPredicate` |    56 |   377 | built-in + existing | `toBe(false)` / `toBeRubyFalsy()`                                                                                                                                    | as above; `toBeFalsy` wrongly passes on `0`                                                                                                                                                                                                                                                                                                                                                                                              | `falsy` → **`equal` today**; `falsy` after the tooling story                                                                                      |
| `assert`             |    94 |   560 | built-in + existing | `toBe(true)` for a boolean; `toBeTruthy()` where the value cannot be `0`, `""` or `NaN`; else `toBeRubyTruthy()`                                                     | `assert` is `test` truthiness (`assertions.rb:171`)                                                                                                                                                                                                                                                                                                                                                                                      | `truthy` → `truthy` (`toBe(true)`: as `assertPredicate`)                                                                                          |
| `assertNil`          |   107 |   407 | built-in            | `toBeNull()` where the port produces `null`; `toBeUndefined()` where it produces `undefined`                                                                         | Ruby has one `nil`. Map it onto the one JS value the port returns. A value that can be both is a port with two nils: converge the source or file it, do not hide it in the assertion. (Probe: `toBeNull` fails on `undefined`, as it should)                                                                                                                                                                                             | `nil` → `nil` (both)                                                                                                                              |
| `assertNotNil`       |    18 |    58 | built-in            | `.not.toBeNull()` where the domain is `null \| T`; `toBeDefined()` where it is `undefined \| T`                                                                      | as above. `.not.toBeNull()` passes on `undefined` (probe), so it is only right where `undefined` cannot occur                                                                                                                                                                                                                                                                                                                            | `notNil` → `notNil` (both)                                                                                                                        |
| `assertMatch`        |    42 |   514 | built-in            | `expect(s).toMatch(m)`                                                                                                                                               | A string `m` is a literal in both (the helper escapes it, `assertions.ts:977`; probe: `toMatch(".")` on `"ab"` fails). The helper returns the `MatchData`; a call site that uses the result reads `m.exec(s)` itself                                                                                                                                                                                                                     | `match` → `match`                                                                                                                                 |
| `assertNoMatch`      |    13 |    57 | built-in            | `.not.toMatch(m)`                                                                                                                                                    | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `noMatch` → `noMatch`                                                                                                                             |
| `assertEmpty`        |    81 |   271 | built-in + existing | `toHaveLength(0)` where the receiver has `length`; `toBeEmpty()` for `Map`, `Set`, a Hash or an `isEmpty` object                                                     | The helper calls `isEmpty` (`assertions.ts:649`). An async `isEmpty` (a `Relation`) returns a Promise, and `toBeEmpty` on a Promise fails (probe): `await` the collection's answer first                                                                                                                                                                                                                                                 | `empty` → **`length` today for `toHaveLength(0)`**; `empty` after the tooling story. `toBeEmpty` → `empty`                                        |
| `assertNotEmpty`     |    37 |    93 | built-in + existing | `.not.toHaveLength(0)` / `.not.toBeEmpty()`                                                                                                                          | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notEmpty` → `notEmpty` (after the tooling story for `toHaveLength`)                                                                              |
| `assertRespondTo`    |    49 |   171 | existing            | `toRespondTo("m")`                                                                                                                                                   | CONTRIBUTING's built-in is `expect(typeof o.m).toBe("function")`, which misses a name answered by `respond_to_missing?` and scores `equal`, never `respondTo`. `toRespondTo` is `rbObjRespondTo` and scores `respondTo`, so it is the one spelling that both answers right and keeps the kind                                                                                                                                            | `respondTo` → `respondTo`                                                                                                                         |
| `assertNotRespondTo` |    31 |   104 | existing            | `.not.toRespondTo("m")`                                                                                                                                              | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notRespondTo` → `notRespondTo`                                                                                                                   |
| `assertIncludes`     |    24 |    79 | built-in            | Array: `toContainEqual(o)` (or `toContain` for a primitive); String / Set: `toContain(o)`; Hash key: `toHaveProperty([k])`; `Map` key: `expect(m.has(k)).toBe(true)` | Minitest is `collection.include?(o)` (`assertions.rb:260`): `Array#include?` uses `==`, so a record element needs `toContainEqual` with care or `toEqualRuby` over a found element; `toContain` on a `Map` does not look at keys (probe)                                                                                                                                                                                                 | `includes` → `includes`; `toHaveProperty` **unmapped today**, `includes` after the tooling story                                                  |
| `assertNotIncludes`  |    11 |    19 | built-in            | `.not.` of the above                                                                                                                                                 | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `excludes` → `excludes`                                                                                                                           |
| `assertKindOf`       |    17 |    53 | built-in + existing | object: `toBeInstanceOf(cls)`; primitive: `toBeExactInstanceOf(String)` / `(Number)`                                                                                 | The helper boxes (`Object(obj) instanceof cls`, `assertions.ts:953`); `toBeInstanceOf(String)` on `"x"` fails (probe). A primitive's `constructor` is its wrapper class, so the exact matcher is right there                                                                                                                                                                                                                             | `kindOf` → `kindOf` / `instanceOf` (folded together today by `HISTOGRAM_FOLD`)                                                                    |
| `assertNotKindOf`    |     1 |     5 | built-in            | `.not.toBeInstanceOf(cls)`                                                                                                                                           | as above; Minitest's `refute_kind_of`                                                                                                                                                                                                                                                                                                                                                                                                    | no mapped kind either side (`NEGATION` has no `kindOf` entry, `RAILS_MAP` no `refute_kind_of`): unchanged                                         |
| `assertInstanceOf`   |     8 |    20 | existing            | `toBeExactInstanceOf(cls)`                                                                                                                                           | `instance_of?` is the exact class (`assertions.rb:271`); `toBeInstanceOf` admits subclasses                                                                                                                                                                                                                                                                                                                                              | `instanceOf` → `instanceOf`                                                                                                                       |
| `assertSame`         |    20 |    41 | built-in            | `toBe(exp)`                                                                                                                                                          | `equal?` is identity; `Object.is` is identity for objects. Strings are primitives in trails (CLAUDE.md § "Ruby Strings are JS string primitives"), so two equal Ruby Strings that are different objects are one JS value: ratified                                                                                                                                                                                                       | `same` → `equal`, folded together by `HISTOGRAM_FOLD`                                                                                             |
| `assertNotSame`      |     4 |     6 | built-in            | `.not.toBe(exp)`                                                                                                                                                     | as above                                                                                                                                                                                                                                                                                                                                                                                                                                 | `notSame` → `notEqual`, folded                                                                                                                    |
| `assertInDelta`      |     8 |    12 | existing            | `toBeWithinDelta(exp, delta)`                                                                                                                                        | `toBeCloseTo`'s digit count cannot say "within 0.001"                                                                                                                                                                                                                                                                                                                                                                                    | `inDelta` → `inDelta`                                                                                                                             |
| `assertOperator`     |     2 |     3 | built-in            | `toBeGreaterThan` / `toBeLessThan` / `…OrEqual`                                                                                                                      | All three sites compare numbers. A Comparable non-number (`Time`, `Duration`) would need `expect(a.compareTo(b))…`; none exists today                                                                                                                                                                                                                                                                                                    | `operator` → `operator`                                                                                                                           |

Bucket counts over the 22 test-facing helpers: **built-in 10**
(`assertNil`, `assertNotNil`, `assertMatch`, `assertNoMatch`,
`assertIncludes`, `assertNotIncludes`, `assertNotKindOf`, `assertSame`,
`assertNotSame`, `assertOperator`), **built-in by default with an existing
matcher fallback 8** (`assertEqual`, `assertNotEqual`, `assertPredicate`,
`assertNotPredicate`, `assert`, `assertEmpty`, `assertNotEmpty`,
`assertKindOf`), **existing matcher always 4** (`assertRespondTo`,
`assertNotRespondTo`, `assertInstanceOf`, `assertInDelta`), **new matcher 0**.
Every helper is then deleted from the codebase. Nothing keeps a copy, because
ported Rails bodies call `expect` too.

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

- **Porting Minitest**, as a package or as module-private helpers. Ruled out by
  the repo owner (2026-10-23). `vendor/minitest/v5.27.0/` is reference only.
- **The `ActiveSupport::Testing::Assertions` half.** Ported Rails API at its
  Rails names, matched by `parity:api` against `assertions.rb`; it stays where
  it is.
- **Minitest's runner and mock classes** (`Minitest::Test`, `Runnable`,
  `Assertion`, `Mock`, `Object#stub`) that trails' `ActiveSupport::TestCase`,
  `testing/autorun.ts` and `method-call-assertions.ts` lean on today. They are
  the same question as this RFC (Minitest is not ported; Vitest is the runner),
  but each needs its own Vitest-shaped answer; see Open questions.
- **A `toBeNil` matcher.** Ruled out by the repo owner (2026-10-22): `nil` maps
  to the JS value the port produces.
- **Changing CONTRIBUTING.md's table.** Ratified. The gates are taught to agree
  with it.

## Alternatives considered

- **Port Minitest as `@blazetrails/minitest`**, enrolled in `parity:api`, with
  ported Rails bodies importing their asserts from it (this RFC's first draft,
  2026-10-22). Rejected by the repo owner (2026-10-23): Minitest is reference
  for porting, not a framework trails runs on.
- **Recast the ActiveSupport assertions as Vitest matchers**
  (`await expect(fn).toChange(() => Post.count(), 1)`). Natural Vitest, but it
  drops the Rails names `assert_difference` / `assert_changes`, which a Rails
  dev would not recognise. Rejected (2026-10-23).
- **Module-private `assertEqual`-style helpers** kept beside the Rails bodies
  that call them. That is the Minitest port again under another name. Rejected
  (2026-10-23).
- **A `@missingRailsCall` receipt at each Rails body's Minitest call.** Dozens
  of receipts for one fact. The mapping table already states the fact once.
- **Keep the Minitest half in activesupport, unexported from the index.**
  Leaves uncredited extra surface in a file that mirrors a different `.rb`.
- **Per-helper sweeps across the tree.** Each file would be touched up to a
  dozen times and every PR would cross packages. Whole-file, per-package bins
  touch each file once.

## Order of work

1. Tooling, independent, may land first:
   `assertion-kinds-reads-literal-matcher-arguments`,
   `call-gate-credits-minitest-asserts-as-expect`, `vitest-matchers-readme`.
2. `ported-rails-assertion-bodies-call-expect`: the three activesupport Rails
   files and the eleven Rails-mirroring files above, after the call-gate story.
3. The 24 `expect-sweep-*` stories, each after
   `assertion-kinds-reads-literal-matcher-arguments`. Each is a whole-file sweep
   over a measured bin of at most 300 call sites (about 600 LOC), smallest
   blast radius first: `expect-sweep-gem-packages`, then activejob, trailties,
   activemodel, activesupport, actionview, activerecord, actionpack.
4. Close-out: `activesupport-index-drops-minitest-assertion-exports`, after every sweep and the
   bodies story.

## Verification

- The import-resolved count in § Measurements reaches **0 call sites in 0 test
  files** (from 5,938 in 392).
- `packages/activesupport/src/testing/assertions.ts` exports only the Rails
  members (`assertNot`, `assertRaises` / `assertRaise`,
  `assertNothingRaised`, `assertDifference`, `assertNoDifference`,
  `assertChanges`, `assertNoChanges`, `_assertNothingRaisedOrWarn`,
  `_callableToSourceString`, `UNTRACKED`), and has no
  `@noRailsEquivalent PERMANENT` tag.
- `rg -l "\b(assertEqual|assertNil|assertPredicate|assertMatch)\(" packages/*/src`
  is empty.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new
  baseline rows and no `@missingRailsCall` naming a Minitest assert.
- `pnpm parity:test:assertions` green at every step, with the `kind` counter
  never rising.

## Open questions

1. **Minitest's runner and mock classes.** `Minitest::Test` / `Runnable` /
   `Assertion` (leaned on by `test-case.ts`, `testing/autorun.ts`,
   `setup-and-teardown.ts`) and `Mock` / `stub` / `assert_mock`
   (`method-call-assertions.ts`, 11 + 3 test files) are Minitest code living in
   activesupport. Under this ruling they are not ported either; the natural
   Vitest answers are Vitest's own lifecycle and `vi.fn` / `vi.spyOn`. Their
   existing stories (0158 `minitest-object-stub-has-no-exported-port`,
   `minitest-test-run-returns-the-test-not-result-from`) should be re-read
   against this ruling. Decided by the repo owner; not in this RFC's scope.

## Changelog

- 2026-10-22: initial RFC (port Minitest as a package)
- 2026-10-23: rewritten by owner ruling. Minitest is vendored reference only;
  ported Rails bodies call `expect`; the call gate credits the mapping; the
  `minitest-package` cluster is closed.
