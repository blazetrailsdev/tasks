---
title: "Kernel#format is not ported, so PG OID::DateTime open-codes its %04d padding"
status: ready
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Kernel#format` has no trails port. `grep -rn "export function format" packages/*/src`
finds only `actionpack`'s `ActionDispatch::Http::MimeNegotiation#format`, which is a
different method; `packages/i18n/src/interpolate/ruby.ts:60` carries a private,
package-local `sprintf` that handles only the specs the i18n interpolation syntax
admits and is not exported.

So every ported body that calls `format(...)` has to open-code the padding, and the
call-parity gate scores the omission. The instance that surfaced this is PG
`OID::DateTime#cast_value`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/date_time.rb:14`):

```ruby
value = value.sub(/^\d+/) { |year| format("%04d", -year.to_i + 1) }
```

PR for `pg-oid-datetime-bc-arm-bypasses-super` converged that arm to the Rails
three lines (rewrite the year, delete the `" BC"` suffix, `super`) but had to spell
`format("%04d", n)` as a sign-aware `padStart`, and so carries
`@missingRailsCall format — CONVERGEABLE <this story>` in
`packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`.

## Acceptance criteria

- [ ] `format` / `sprintf` are ported to `@blazetrails/ruby-compat` at the Ruby
      names, covering at least the flag/width/precision specs Ruby documents for
      the integer, float and string conversions the repo actually calls.
- [ ] PG `OID::DateTime#cast_value` calls it and drops its `@missingRailsCall
format` receipt; `pnpm parity:api:calls` stays green.
- [ ] `grep -rn "padStart\|padEnd" packages/*/src` is reviewed for other
      open-coded `format` call sites and each is either converted or listed here.

## Attempted in #7627 and withdrawn — scope is much larger than 120 LOC

A first port was written and reviewed on #7627, then removed from that PR
rather than shipped. Review found ten distinct MRI divergences, every one of
which reproduces against the pinned `vendor/ruby` tree, so they are recorded
here as acceptance criteria rather than rediscovered:

1. **Hang (P1).** `%x`/`%o` with a negative non-integer (`-0.5`) or `-Infinity`
   enters the two's-complement loop and never terminates — it blocks the event
   loop, so it is not even catchable by a timeout. Convert to an integer before
   choosing the negative branch and reject non-finite input
   (`vendor/ruby/sprintf.c:590`).
2. **Scanner.** `%*d`, `%2$d`, `%<name>d`, `%.s` and a malformed trailing `%`
   are silently preserved rather than parsed or rejected; `%5%` succeeds where
   MRI raises `ArgumentError: invalid format character - %`. Port the scanner
   and its validation from `vendor/ruby/sprintf.c:289,338,398,412`, including
   named arguments and the `a`/`A` conversions at `:878`.
3. **Too few arguments.** `format("%s")` returns `""` where MRI raises
   `ArgumentError: too few arguments`; check availability as `GETNTHARG` does
   (`vendor/ruby/sprintf.c:111`).
4. **Numeric conversion.** `Number()` is not Ruby's: `%d` with `"010"` must be
   `8` (octal), `"1.5"` must raise `ArgumentError: invalid value for Integer():
"1.5"`, and bigint / conversion-protocol objects must be accepted. Reuse
   `kernelInteger` / `kernelFloat`, which already exist in this package
   (`vendor/ruby/sprintf.c:590,885`).
5. **Prefix and zero-precision octal.** `%#08x` with `255` must be `0x0000ff`,
   not `00000xff`; `%#.0o` with `0` must keep the `0`
   (`vendor/ruby/sprintf.c:738,771`).
6. **Precision disables zero-fill.** `%08.4x` with `-1` must be `    ..ff`, not
   `..ffffff` — match the `FZERO|FMINUS|FPREC` condition
   (`vendor/ruby/sprintf.c:756`).
7. **`%g`.** Notation is chosen before rounding and the alternate point is
   dropped: `%.1g` with `9.99` must be `1e+01`, `%#.1g` with `1` must be `1.`
   (`vendor/ruby/vsnprintf.c:903,938`).
8. **`%f` rounding and range.** `toFixed` is not Ruby: `%.0f` with `2.5` must be
   `2` (round-half-even), and large values must not fall back to exponent
   notation. Needs a real decimal conversion
   (`vendor/ruby/sprintf.c:925`; `vendor/ruby/vsnprintf.c:1230`).
9. **Float specials.** `%f` must accept NaN, print `Inf` rather than
   `Infinity`, and keep the sign of `-0`
   (`vendor/ruby/sprintf.c:886`; `vendor/ruby/vsnprintf.c:1243`).
10. **`%c` and character counting.** `%c` needs string/integer conversion, not
    `to_s` (nil must not become `""`), and `s`/`c` width and precision count
    characters, not UTF-16 units, so an astral character must not split
    (`vendor/ruby/sprintf.c:449,506`).

The estimate is raised from 120 to 400 LOC on that evidence. `ruby-compat` is
the package the tree is meant to converge ONTO, so a partially-correct
primitive here is worse than none: it gets propagated by design. Ship this only
with an MRI-differential test suite.

## Call-site audit (required by the original acceptance criteria)

Open-coded `format` call sites found, none yet converged:

- `packages/activerecord/src/connection-adapters/postgresql/oid/date-time.ts`
  — carries `@missingRailsCall format — CONVERGEABLE kernel-format-is-not-ported`
  (`postgresql/oid/date_time.rb:14`).
- `packages/activerecord/src/connection-adapters/postgresql/oid/date.ts` —
  carries `@missingRailsCall format — PERMANENT`, which is mis-tagged: the arm
  is convergeable, and it additionally routes BC dates through
  `parsePostgresDate` instead of Rails' rewrite-and-`super`
  (`postgresql/oid/date.rb:13-14`).
- `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:282` —
  open-codes the same `%04d` as `postgresql/quoting.rb:145`.
- `TimeZone.secondsToUtcOffset` — `activesupport/lib/active_support/values/time_zone.rb:199`.
- `packages/i18n/src/interpolate/ruby.ts:60` — a private `sprintf` that is MORE
  complete than the withdrawn port. It raises `I18n::ArgumentError` /
  `TypeError` subclasses its own tests assert on, so converging it onto
  ruby-compat needs those error classes reconciled; shape the ruby-compat port
  from this body so the convergence is a deletion.
