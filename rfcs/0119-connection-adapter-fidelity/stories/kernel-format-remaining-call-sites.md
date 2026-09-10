---
title: "rack's common logger open-codes two Kernel#sprintf calls"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 180
pr: 7664
claim: "2026-09-10T13:19:53Z"
assignee: "mysql2-internal-execute-and-exec-query-overrides-rails-lacks"
blocked-by: null
closed-reason: null
---

## Context

`kernel-format-is-not-ported` (#7637) landed `format` / `sprintf` in
`@blazetrails/ruby-compat` (`packages/ruby-compat/src/kernel-format.ts`, a port
of `rb_str_format`, `vendor/ruby/sprintf.c:212`, with the `BSD__dtoa` fast path
from `vendor/ruby/missing/dtoa.c:2895`). Note the exported names are `format`
and `sprintf`, NOT the `kernelFormat` / `kernelSprintf` that
`i18n-private-sprintf-duplicates-kernel-sprintf` predicted: neither collides
with a JS global the way `Integer` / `Float` do, so the Ruby names stand.

That story's third acceptance criterion asked for a review of every remaining
`padStart` / `padEnd` in `packages/*/src`. There are ~117; most stand in for
`strftime`, `Integer#to_s(base)` or table layout and have no Ruby `format`
behind them. Rack's common logger is the one file where two do:

- `packages/rack/src/common-logger.ts:19` — `sprintf("\\x%x", c.ord)`
  (`vendor/rack/lib/rack/common_logger.rb:69`), spelled as
  `ch.charCodeAt(0).toString(16).padStart(2, "0")`. That is a behavioural
  divergence as well as a missing call: Ruby's `%x` of `10` is `"a"`, the
  `padStart` gives `"0a"`, so every non-printable byte below `0x10` is logged
  with an extra digit.
- `packages/rack/src/common-logger.ts` `log` — `sprintf(FORMAT, …)` with eleven
  arguments (`common_logger.rb:56-67`), open-coded as template interpolation.
  `FORMAT` itself is `common_logger.rb:38`.

The i18n half of that audit is NOT here: it already had a story,
`i18n-private-sprintf-duplicates-kernel-sprintf`, filed from PR #7627's audit
with the error-class blocker worked out. Do that one there.

## Converged shape

`log` calls `sprintf(FORMAT, …)` with Rails' eleven arguments in Rails' order,
and the `gsub!` block calls `sprintf("\\x%x", …)` — both from
`@blazetrails/ruby-compat`, so the `%x` width bug goes away by construction
rather than by a second hand-rolled pad.

## Acceptance criteria

- [ ] `packages/rack/src/common-logger.ts` calls ruby-compat's `sprintf` at both
      sites, with Rails' argument list and order.
- [ ] A test pins `%x` of a byte below `0x10` rendering as one digit, matching
      Ruby, since that is a live behavioural change to logged output.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green, and
      the rack suite is green.
