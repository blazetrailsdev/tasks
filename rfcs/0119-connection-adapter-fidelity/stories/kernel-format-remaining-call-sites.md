---
title: "kernel-format-remaining-call-sites"
status: draft
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
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

`kernel-format-is-not-ported` landed `format` / `sprintf` in
`@blazetrails/ruby-compat` (`packages/ruby-compat/src/kernel-format.ts`, a port of
`rb_str_format`, `vendor/ruby/sprintf.c:212`, with the `BSD__dtoa` fast path from
`vendor/ruby/missing/dtoa.c:2895`) and converged the four call sites that story
named: PG `OID::DateTime#cast_value`, PG `OID::Date#cast_value`,
`PostgreSQL::Quoting#quoted_date` and `TimeZone.seconds_to_utc_offset`.

Its third acceptance criterion asked for a review of every remaining
`padStart`/`padEnd` in `packages/*/src`. There are ~117; most stand in for
`strftime`, `Integer#to_s(base)` or table layout and have no `format` behind
them. These two do have a Ruby `sprintf` behind them and are NOT converged:

- `packages/rack/src/common-logger.ts:19` — `sprintf("\\x%x", c.ord)`
  (`vendor/rack/lib/rack/common_logger.rb:69`). The TS spells it
  `padStart(2, "0")`, which is a behavioural divergence as well as a missing
  call: Ruby's `%x` of `10` is `"a"`, ours is `"0a"`.
- `packages/rack/src/common-logger.ts` `log` — `sprintf(FORMAT, …)` with eleven
  arguments (`common_logger.rb:56`), open-coded as template interpolation.
- `packages/i18n/src/interpolate/ruby.ts:60` — a private, package-local
  `sprintf` standing in for `sprintf("%#{$3}", value)`
  (`vendor/i18n/lib/i18n/interpolate/ruby.rb:46`). Converging it onto
  ruby-compat's `format` is a deletion of ~110 lines, but it raises
  `I18n::ArgumentError` and `TypeError` subclasses its own tests assert on
  (`packages/i18n/src/interpolate/ruby.test.ts`), so the error classes have to
  be reconciled first — ruby-compat raises its own `ArgumentError` /
  `TypeError`.

## Acceptance criteria

- [ ] `packages/rack/src/common-logger.ts` calls ruby-compat's `format` for both
      `sprintf` sites, with Rails' argument list and order.
- [ ] `packages/i18n/src/interpolate/ruby.ts`'s private `sprintf` is deleted and
      the call routed to ruby-compat's `format`, with the I18n error classes
      reconciled so `interpolate`'s existing tests still see the errors they
      assert on.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
