---
title: "message-pack narrows the shared Rational's bigint parts to Number at the packer seam"
status: draft
updated: 2026-08-30
rfc: "0041-activesupport-messagepack-ext"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Extensions.writeRational` (`packages/activesupport/src/message-pack/extensions.ts:228-230`)
narrows the shared `Rational`'s parts at the msgpack seam:

    packer.write(Number(rational.numerator));
    if (rational.numerator !== 0n) packer.write(Number(rational.denominator));

Ruby writes the Integer itself
(`activesupport/lib/active_support/message_pack/extensions.rb:120-123`):

    def write_rational(rational, packer)
      packer.write(rational.numerator)
      packer.write(rational.denominator) unless rational.numerator.zero?
    end

A Ruby Integer is arbitrary precision, which is why the ported `Rational`
(`packages/ruby-compat/src/rational.ts`, `vendor/ruby/rational.c:580` /
`:598`) is `bigint`-backed — a parsed fraction of more than sixteen digits runs
past `Number.MAX_SAFE_INTEGER`. The `Number()` narrowing therefore loses
precision silently for exactly the values the `bigint` choice exists to carry,
and `readRational` (`:234`) reads them back as `number` before handing them to
`rational()`. Introduced by PR #7240, which converged message-pack's fourth
private `Rational` onto the shared one; the previous local shape was
`number`-backed throughout, so the narrowing was invisible there.

The packer/unpacker (`packages/activesupport/src/message-pack/factory.ts`) is
where the fix belongs: msgpack has integer types wide enough for a 64-bit value
and Ruby's own serializer relies on that.

## Converged shape

`writeRational` passes `rational.numerator` / `rational.denominator` unnarrowed
and `readRational` reads Integers back without a `number` round trip, so a
Rational whose parts exceed `Number.MAX_SAFE_INTEGER` survives a pack/unpack
cycle exactly as it does in Ruby.

## Acceptance criteria

- No `Number(...)` narrowing in `writeRational` / `readRational`.
- A round-trip test over a numerator past `Number.MAX_SAFE_INTEGER` (the
  `date_parse.c:2319-2325` case the `bigint` parts exist for) that FAILS on
  today's code.
- `extensions.trails.test.ts`'s four existing cases stay green, names unchanged.
