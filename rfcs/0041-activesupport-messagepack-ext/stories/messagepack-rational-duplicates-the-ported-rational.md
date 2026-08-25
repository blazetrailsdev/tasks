---
title: "message-pack declares a second Rational instead of the ported one"
status: draft
updated: 2026-08-07
rfc: "0041-activesupport-messagepack-ext"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby has exactly one `Rational`. trails has two, and only one of them is the
port.

`packages/activesupport/src/message-pack/extensions.ts:27-48` declares its own
local shape and its own reduction:

```ts
interface Rational {
  numerator: number;
  denominator: number;
}

function rational(numerator: number, denominator: number): Rational {
  if (denominator === 0) throw new ZeroDivisionError("divided by 0");
  const sign = denominator < 0 ? -1 : 1;
  if (numerator === 0) return { numerator: 0, denominator: 1 };
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  ...
}
```

`packages/date/src/date.ts` exports the ported `Rational` class — `rational.c`
`nurat_s_canonicalize_internal` in its constructor, `nurat_add` / `nurat_mul` /
`nurat_div` / `num_div` / `num_modulo` / `nurat_to_i` / `nurat_round` /
`nurat_to_f` / `nurat_to_s` as methods, each tagged with its `rational.c`
counterpart. PR #6186 made its `numerator` / `denominator` `bigint`, as Ruby's
Integers are.

So the message-pack extension reduces a Rational with a hand-rolled `gcd` over
`number` fields while a ported `i_gcd` over `bigint` sits one package away, and
a decoded Rational silently loses exactness past `Number.MAX_SAFE_INTEGER`
where the ported one does not. `ActiveSupport::MessagePack::Extensions`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb`)
registers `::Rational` — Ruby's own — and calls `Rational(numerator,
denominator)`, the same constructor `Date._parse` builds its `:sec_fraction`
with. There is no second Rational on the Rails side to mirror.

This was flagged during the #6186 review as correctly-untouched (the local
interface never imports `@blazetrails/date`, so it was not a missed caller) —
correct for that PR's scope, but the duplication itself is the deviation.

## Converged shape

`extensions.ts` imports `Rational` from `@blazetrails/date` and drops its local
`interface Rational`, its `rational()` helper and its `gcd()`. The
sign-normalization the local helper does (`readRational(1, -2)` →
`{numerator: -1, denominator: 2}`) is `nurat_s_canonicalize_internal`'s job and
belongs on the ported class if it is missing there — `rational.c`
canonicalizes the sign onto the numerator, and the ported constructor
currently does not, which is a second convergence in the same change.

`writeRational` / `readDatetime` then read `numerator` / `denominator` as
`bigint`, and `readDatetime`'s nanosecond computation goes through
`Rational#toF` at the `number` seam, as `type/time.ts` and
`sql-datetime.ts` already do.

Check `extensions.trails.test.ts` — its four cases assert the local shape with
`toEqual({ numerator: -1, denominator: 2 })` and become `toEqual(new
Rational(-1, 2))`, which is what MRI prints.

## Acceptance criteria

- [ ] `extensions.ts` has no local `Rational` interface, `rational()` or
      `gcd()`; it uses `@blazetrails/date`'s ported class.
- [ ] The ported `Rational` constructor canonicalizes the sign onto the
      numerator, per `rational.c` `nurat_s_canonicalize_internal`, with a case
      covering a negative denominator.
- [ ] `ZeroDivisionError` still raises on a zero denominator, from wherever
      Ruby raises it.
- [ ] Every existing message-pack case passes unchanged in value.
