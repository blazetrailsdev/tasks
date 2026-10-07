---
title: "BigDecimal MaxPrec follows MRI outside literal parsing (_dump prefix)"
status: done
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8623
claim: "2026-10-07T11:41:05Z"
assignee: "big-decimal-max-prec-outside-literal-parse"
blocked-by: null
closed-reason: null
---

## Context

`BigDecimal#_dump` (`vendor/ruby/v3.3.11/ext/bigdecimal/bigdecimal.c:781-799`)
prefixes the value with `VpMaxPrec(vp)*VpBaseFig()`. trails'
`packages/ruby-compat/src/big-decimal.ts` records `maxPrec` only where `VpAlloc`
parses a literal (`bigdecimal.c:5416-5423`, `(ni + nf + BASE_FIG - 1) / BASE_FIG + 1`),
and applies that same string formula to every other construction:

- an Integer (`rb_inum_convert_to_BigDecimal`, `bigdecimal.c:3406`),
- a Float or Rational with `ndigits`,
- the result of `mult` / `round` / `abs`, which trails rebuilds through a plain
  string in `fromUnscaled`, where MRI allots `MaxPrec` per operation,
- a value read by `BigDecimal._load`, where MRI clamps `MaxPrec` to the dumped
  prefix (`bigdecimal.c:819-823`).

So the `<precision>:` prefix of a non-literal BigDecimal can differ from MRI's.
The prefix is only an allocation hint to `_load`, so the value still decodes in
Ruby, but the MessagePack ext type 2 payload
(`activesupport/lib/active_support/message_pack/extensions.rb:31-33`) is then
not byte-identical.

## Acceptance criteria

- [ ] `maxPrec` follows MRI for Integer, Float and Rational construction and for
      `mult` / `round` / `abs` results, each verified against `ruby -rbigdecimal`
      at the vendored bigdecimal version (3.1.5).
- [ ] `BigDecimal._load` applies the `bigdecimal.c:819-823` clamp.
- [ ] `big-decimal.trails.test.ts` pins `_dump` for each construction path.
