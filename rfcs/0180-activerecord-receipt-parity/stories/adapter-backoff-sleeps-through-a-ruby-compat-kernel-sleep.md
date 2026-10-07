---
title: "parity: Kernel#sleep is credited by the promise-settling setTimeout; AbstractAdapter#backoff's receipt retires"
status: in-progress
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8635
claim: "2026-10-07T14:56:49Z"
assignee: "adapter-backoff-sleeps-through-a-ruby-compat-kernel-sleep"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`AbstractAdapter#backoff` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1078-1080`) is `sleep 0.1 * counter` (`Kernel#sleep`, `vendor/ruby/v3.3.11/process.c:5055` `rb_f_sleep`).

`packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `backoff` is `new Promise((resolve) => setTimeout(resolve, 100 * counter))` and carries `@missingRailsCall sleep`.

**This story was respec'd on 2026-10-07 (Dean, in conversation).** It previously called for a ruby-compat `Kernel#sleep` port that `backoff` would call. That mechanism is rejected: the receipt converges by teaching the call gate the native form instead, which is what `NATIVE_FORM_ANALOGUES` (`scripts/api-compare/enumerable-idioms.ts`) already does for `load` → `import(x)`, `call` → `()`, `size` → `.length` and `prepend` → `.unshift`. A `Kernel#sleep` port would add MRI surface whose only distinguishing behaviour — `value`-returning suspension — has no synchronous JS form, for a call set of one production site.

The credited form is the one-shot suspension `setTimeout`, NOT `setInterval`:
asked directly with both alternatives spelled out, Dean ratified `setTimeout`
(2026-10-07). `setInterval` repeats where `rb_f_sleep` suspends once and
returns, and there are zero `setInterval` calls in any package's non-test
`src`, so a `setInterval`-keyed row would credit no body at all.

Do not file a follow-up to add `rbFSleep`.

## Acceptance criteria

- [ ] `NATIVE_FORM_ANALOGUES` carries a `sleep` row keyed to the one-shot suspension `new Promise((resolve) => setTimeout(resolve, ms))`, with `receivers: "implicit-self"` — the one shape `Kernel#sleep` takes (`rb_define_global_function`, `process.c:9125`), so an `x.sleep` site still flags.
- [ ] The mark is NOT every `setTimeout`. A timer that schedules work (a deadline, a retry, a bare callback) is not a suspension and credits nothing: `Reaper#spawn_thread`'s `setTimeout(tick, frequency * 1000)` must not satisfy a Rails `sleep`.
- [ ] `setInterval` credits nothing — it repeats where `sleep` suspends once (ratified, see Context).
- [ ] `backoff`'s `@missingRailsCall sleep` receipt is deleted, and its interval keeps Rails' `0.1 * counter` legible at the call site, since no call-argument row compares it once the Ruby call leaves significance.
- [ ] Unit tests pin the table row, the extractor discriminator, and both negative cases. A regression check shows the row is load-bearing: with it removed, `backoff` flags `sleep → sleep|_sleep`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` green, with no `sleep` row anywhere in `call-mismatches.json` and `staleTags` at 0.

## Verification

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls
```
