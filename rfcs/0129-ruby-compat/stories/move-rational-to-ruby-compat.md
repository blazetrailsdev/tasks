---
title: "Rational moves out of the date gem port into ruby-compat, removing activemodel's accidental dependency on @blazetrails/date"
status: claimed
updated: 2026-08-30
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "date", "activemodel"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 230
priority: 8
pr: null
claim: "2026-08-30T14:42:41Z"
assignee: "move-rational-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`Rational` is a Ruby core value type. It lives at
`packages/date/src/date.ts:1241`, inside the vendored **date gem** port, purely
because `date_zone_to_diff`'s fractional-hour offset was the first body that
needed it. `Rational` is not part of the date gem.

The class is a careful port and its JSDoc is worth reading before touching it
(`date.ts:1225-1240`): it cites `rational.c` `nurat_s_canonicalize_internal`,
`nurat_add`, `nurat_s_convert` and `float_to_r` by symbol, records that
`numerator`/`denominator` are `bigint` because Ruby Integers are arbitrary
precision and a parsed fraction literal of more than sixteen digits
(`date_parse.c:2319-2325`) runs past `Number.MAX_SAFE_INTEGER`, and records the
measured MRI behaviour it matches — "on ruby 3.3.11
`(Rational(1,2) * 12).class` is `Rational`, `(6/1)`, and so is `Rational(9,3)`",
which is why the ported `FIXNUM_P` branch is unreachable. All of that carries across verbatim, and the
vendored MRI pin (`v3_3_11`) is what finally makes those claims checkable.

The dependency this fixes: `Rational` is exported from `@blazetrails/date` and
imported across a package boundary by activemodel —
`activemodel/src/type/decimal.ts:2,35`, `type/date-time.ts:4,59`,
`type/helpers/time-value.ts:1,73-79`, plus their tests
(`decimal.test.ts:3,36-49`, `time-value.test.ts:2,104-116`). activemodel
depending on the date gem package to cast a decimal is an edge that exists only
because the value type has no home.

**Ruby has TWO spellings and trails has one.** `Rational` the class, and
`Kernel#Rational()` the conversion function — and Rails calls the **function**.
`grep -rn "Rational(" vendor/rails/{activesupport,activerecord}/lib` returns 20
sites: `time_with_zone.rb:487,564`, `core_ext/date_time/calculations.rb:54,56,57,117,141,153,165`,
and more. Three of them are already baselined in
`call-mismatches-exclude/activesupport/core-ext/date-time/calculations.json`
(`end_of_day`, `end_of_hour`, `end_of_minute`), and that row states the problem
and its catch:

> `Rational()` is a Kernel FUNCTION in Ruby; the port's Rational is a class
> (`@blazetrails/date` date.ts:1241) and JS has no way to construct one without
> `new`, so the kwarg value is `new Rational(999999999, 1000)` — the same value
> under the only spelling the language has. (A Kernel-style `Rational()` factory
> would additionally have to canonicalize `Rational(n, 1)` to an Integer, which
> `new Rational` deliberately does not.)

So the function is **not** an alias for the constructor: `Rational(n, 1)` folds to
an Integer and `new Rational(n, 1)` does not. That is the same fold the class's
own JSDoc describes — "Only `rb_rational_new`, the C constructor `Date#day_fraction`
and `#sec_fraction` answer through, folds a denominator of one to an Integer" —
so the two must be ported as the two distinct things MRI has (`nurat_s_convert`
for the function, `nurat_s_new` for the class), not one wrapping the other
carelessly. Export both; the 20 call sites then have a call to make, and the
three baseline rows converge.

**There is a FOURTH `Rational`, and this story absorbs it.**
`packages/activesupport/src/message-pack/extensions.ts:27-48` declares its own
local `interface Rational { numerator: number; denominator: number }` and its own
`rational()` reduction (a `gcd` cancel with a sign fix and a
`ZeroDivisionError("divided by 0")` raise). RFC 0041's draft story
`messagepack-rational-duplicates-the-ported-rational` opens with the line "Ruby
has exactly one `Rational`. trails has two, and only one of them is the port."
Converge it here — the messagepack extension calls the shared class — and the PR
body says so, so that story can be closed rather than left pointing at a package
that has moved. Watch the type difference: the local shape is `number`-backed
where the port is `bigint`-backed, which is a real behavioural change at the
messagepack boundary and needs its round-trip test exercised, not assumed.

Related in-file: `wholenumP` (referenced from the same JSDoc) and `floatToR` —
check whether each is Rational's or the date port's, and split accordingly.
Per the standing rule, only members with call sites move; anything in the class
that no caller reaches is deleted, not relocated.

## Acceptance criteria

- Both spellings ship: the `Rational` **class** and the `Kernel#Rational()`
  **function**, with the `Rational(n, 1)` → Integer fold on the function only,
  pinned by a test that asserts the two differ.
- The three `change` rows in
  `call-mismatches-exclude/activesupport/core-ext/date-time/calculations.json`
  are deleted (only-shrink, by hand, sorted, via `serializeBaseline` — no
  reseed), and the `end_of_day` / `end_of_hour` / `end_of_minute` bodies call the
  function.
- `Rational` lives at `packages/ruby-compat/src/rational.ts` with its full JSDoc
  carried over and `vendor/ruby/rational.c:LINE` citations for
  `nurat_s_canonicalize_internal`, `nurat_add`, `nurat_s_convert` and
  `float_to_r`.
- `packages/date` imports it from `@blazetrails/ruby-compat` and re-exports it
  under its existing name so `@blazetrails/date`'s public surface is unchanged
  (shim; deleted by the final story).
- activemodel's five source/test sites import from `@blazetrails/ruby-compat`;
  activemodel's `package.json` dependency on `@blazetrails/date` is dropped **if
  and only if** nothing else in the package needs it (check `Temporal`, which
  `type/helpers/time-value.ts:1` imports from the same module — if it does, the
  edge stays and the PR body says so).
- `date` gains a dependency on `ruby-compat`; `ruby-compat` gains none.
- Members with no call site trimmed; the PR body lists each kept member with its
  justifying call site.
- The `Rational` tests move with the class, names unchanged.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; the `date` package's own numbers do not
  regress.
