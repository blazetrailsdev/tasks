---
title: "Make Time.use_zone (useZone) and I18n.with_locale (withLocale) restore when an async block settles"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activesupport", "i18n"]
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ActiveJob wraps every perform in `Time.use_zone(job.timezone, &block)`
(`vendor/rails/v8.0.2/activejob/lib/active_job/timezones.rb:8`) and `I18n.with_locale(job.locale, &block)`
(`translation.rb:8`), and under the RFC's async shape `block` returns a
promise. Ruby restores in an `ensure`, which runs after the block has done all
its work. Ported literally, JS restores when the block _returns_ its promise:

- `packages/activesupport/src/time-zone-config.ts:24-39` (`useZone`) throws on
  an async block: "useZone does not support async callbacks; the zone would be
  restored before awaited work runs".
- `packages/i18n/src/i18n.ts:254-266` (`withLocale`) restores synchronously.

Converge both: when the block returns a thenable, restore when it settles; a
sync block keeps the plain `finally` path. Note what Rails restores:
`old_zone, ::Time.zone = ::Time.zone, new_zone` (`zones.rb:64`) captures the
_reader's_ value, which is `zone_default` when nothing was set (`:14-15`), so
after `use_zone` the per-context zone is explicitly the default rather than
unset. Keep that. Rails stores both values per
execution context (`Time.zone` is `IsolatedExecutionState[:time_zone]`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/zones.rb:15`,
`:42`). If a trails store is still module-global, two concurrent jobs would see
each other's zone: check it, and converge it onto `IsolatedExecutionState` if
so.

## Acceptance criteria

- [ ] `useZone` no longer throws on an async block; both restore on settle, and their existing sync tests stay green.
- [ ] A `.trails.test.ts` per function awaits inside the block and asserts the zone/locale is still set after the `await` and restored after the promise settles.
- [ ] Two concurrent `useZone` calls in separate execution contexts do not see each other's zone.

## Definition of done

Catching `useZone`'s error, or awaiting the body outside `useZone` / `withLocale` so the zone is never set during the work, does not close this story.
