---
title: "Converge ActionController::LogSubscriber's five event bodies and delete the invented halted/redirect"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 23
pr: 7501
claim: "2026-09-04T23:26:00Z"
assignee: "io-write-must-transcode-to-utf8-in-text-mode"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/log-subscriber.ts` diverges from
`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:46-75` in six
ways, all surfaced while porting the file's `subscribe_log_level`
registrations (#7442). `startProcessing` and `processAction` are already
converged; these are the five short bodies below them.

**Two invented methods.** `halted` (`log-subscriber.ts:96`) and `redirect`
(`:111`) have no Rails counterpart — they duplicate `haltedCallback` and
`redirectTo` with different message text, and `redirect` invents a
`(${status})` suffix from a payload key `redirect_to.action_controller` does
not carry. Rails declares only `halted_callback` (`:46`) and `redirect_to`
(`:56`). Both should be deleted; nothing registers a log level for them, so
they are unreachable through `attach_to`.

**The block form.** Every one of these Rails bodies is `info { "..." }` — the
string is not built when the subscriber is silenced. The port passes an eager
template string to `this._info(...)`. `_info` already takes
`string | (() => string)` and `processAction` uses the thunk, so the fix is
`this._info(() => \`...\`)` at each site.

**`round` vs `toFixed`.** `send_file` (`:52`) and `send_data` (`:62`) are
`event.duration.round(1)`; the port is `event.duration.toFixed(1)`. Ruby's
`round(1)` answers a Float — `12.0` renders as `12.0`, and an integral
duration renders without a trailing zero pair — where `toFixed(1)` always
answers a String with exactly one decimal. `round` from
`@blazetrails/ruby-compat` is already imported in this file for
`processAction`.

**`inspect` vs hand-quoting.** `halted_callback` (`:47`) is
`event.payload[:filter].inspect`; the port hardcodes `"${filter}"` double
quotes. A Symbol filter inspects as `:foo`, not `"foo"`, and trails already
spells a Symbol value with its leading colon.

**`send_data`'s absent-filename arm.** Rails interpolates
`event.payload[:filename]` directly (`:62`), so a nil filename renders as the
empty string; the port substitutes `"(inline)"`.

**`unpermitted_parameters` drops `color(..., RED)` and makes Context
conditional.** Rails (`:68-73`) always emits `. Context: { ... }` and wraps the
whole message in `color(msg, RED)`; the port emits Context only when the
payload carries one and never colors. `LogSubscriber#color`
(`activesupport/lib/active_support/log_subscriber.rb`) and its `RED` constant
are the members to call.

## Acceptance criteria

- `halted` and `redirect` are deleted from
  `packages/actionpack/src/action-controller/log-subscriber.ts`; nothing else
  in the repo references them.
- `haltedCallback`, `sendFile`, `sendData`, `redirectTo` and
  `unpermittedParameters` each mirror `log_subscriber.rb:46-75` line for line:
  the `info`/`debug` block form, `round(event.duration, 1)`, `inspect` on the
  filter, the bare filename interpolation, and `color(..., RED)` around an
  unconditional Context clause.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` show no new rows;
  `pnpm parity:api:extra --package actionpack` no longer lists `halted` or
  `redirect`.
- The actionpack suite is green, including
  `log-subscriber.trails.test.ts`'s level partition.
