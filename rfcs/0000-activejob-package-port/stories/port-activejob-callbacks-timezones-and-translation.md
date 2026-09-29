---
title: "Port ActiveJob::Callbacks, Timezones and Translation, with settle-time restore in useZone / withLocale"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "activesupport", "i18n"]
deps: ["port-activejob-enqueuing-execution-and-inline-adapter"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails files, under `vendor/rails/v8.0.2/activejob/lib/active_job/`:

- `callbacks.rb:18-166`: the `:perform` and `:enqueue` chains, both
  `define_callbacks … skip_after_callbacks_if_terminated: true` (`:27-30`), and the six class
  macros `before_perform` / `after_perform` / `around_perform` /
  `before_enqueue` / `after_enqueue` / `around_enqueue` (`:50-165`), each a
  `set_callback`. The singleton `:execute` chain (`:22-25`) already landed with
  `port-activejob-enqueuing-execution-and-inline-adapter`.
- `timezones.rb:4-12`: `around_perform { |job, block| Time.use_zone(job.timezone, &block) }`.
- `translation.rb:4-12`: `around_perform { |job, block| I18n.with_locale(job.locale, &block) }`.

`Base` gains `include Callbacks`, `include Timezones` and
`include Translation` in `base.rb:70,74,75` order.

**The blocker is in activesupport and i18n, and this story fixes it.** Under
the RFC's async shape, `block` is a promise-returning `_perform_job`.
Ruby's `Time.use_zone` and `I18n.with_locale` restore in an `ensure`. Ported
literally, they restore when the block _returns_ its promise, which is before
the awaited body runs:

- `packages/activesupport/src/time-zone-config.ts:24-39` (`useZone`) goes
  further and **throws** on an async block ("useZone does not support async
  callbacks").
- `packages/i18n/src/i18n.ts:254-266` (`withLocale`) restores synchronously.

Converge both so that when the block returns a thenable, the restore is
deferred to its settle, and a sync block keeps the plain `ensure` path. Rails
stores both values per execution context (`Time.zone` is
`IsolatedExecutionState[:time_zone]`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/zones.rb:15`),
so check how trails already scopes each one. If a value is still a module
global, name that in the PR rather than widening this story. The trap is
documented: a restore that runs before the promise settles is only caught by
a test that awaits inside the block.

The callbacks run on activesupport's chain, which already awaits
promise-returning callbacks and `around` blocks
(`packages/activesupport/src/callbacks.ts:47-56`). `skip_after_callbacks_if_terminated`
and the `:abort` terminator keep Rails' behavior: `enqueue` returns `false` when
`before_enqueue` throws `:abort` (`enqueuing.rb:112-125`).

Fixtures (RFC "Canonical job fixtures"): `jobs/callback-job.ts`,
`abort-before-enqueue-job.ts`, `timezone-dependent-job.ts`,
`translated-hello-job.ts`.

Tests:

- `test/cases/callbacks_test.rb`: 8;
- `test/cases/timezones_test.rb`: 2;
- `test/cases/translation_test.rb`: 1;
- a `.trails.test.ts` case for each of `useZone` and `withLocale` with an
  awaited block, asserting that the zone or locale is still set after an
  `await` inside the block and is restored after the promise settles.

## Acceptance criteria

- [ ] `callbacks.rb`, `timezones.rb` and `translation.rb` read complete in
      `parity:api`.
- [ ] `useZone` no longer throws on an async block, and both it and
      `withLocale` restore on settle. Their existing sync tests stay green.
- [ ] The 11 Rails cases pass in the `inline` lane.
