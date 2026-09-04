---
title: "Ruby's stdlib MonitorMixin moves to ruby-compat, once a leaf may hold the async-context adapter"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord"]
deps: ["ruby-named-file-dir-fileutils-facade"]
deps-rfc: []
est-loc: 220
priority: 6
pr: 7484
claim: "2026-09-04T14:50:46Z"
assignee: "port-zlib-gzipreader-open-for-schema-cache-read"
blocked-by: null
closed-reason: null
---

## Context

**File this as blocked-shaped work: it is a genuine ruby-compat candidate that
the leaf rule stops today.** Filed anyway, per the RFC's own handling of
`Tempfile` — a tracked blocked story is the deliverable; a silently dropped
candidate is not.

`packages/activesupport/src/concurrency/monitor.ts` (**125 lines**; exports
`synchronize` at `:80`, `interface MonitorMixin` at `:114`, `class Monitor` at
`:123`) is Ruby's **stdlib `MonitorMixin`** — the reentrant lock Rails classes
pick up with `include MonitorMixin`, e.g.
`vendor/rails/activerecord/lib/active_record/connection_adapters/
pool_config.rb:6`. Its own header says so:

> There is no Rails file to mirror because `monitor` is Ruby stdlib, so this
> lives next to the other lock primitive we already carry
> (`concurrency/null-lock.ts`).

RFC 0129's _Deferred_ table lists `Mutex` ("`synchronize` is a
`NO_JS_CALL_FORM` entry", inherited from RFC 0089); `MonitorMixin` is the
concrete in-tree instance of that entry, and `synchronize` is one of the nine
`NO_JS_CALL_FORM` names at `scripts/api-compare/compare.ts:249`. The RFC's
Non-goals say `synchronize` stays suppressed because there is "a body with no
mutex" — but this body IS a mutex, so that reasoning does not cover this file;
whether homing it can retire the entry is a question for
`retire-no-js-call-form-entries-and-fetch-receipts`, not an assumption here.

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed:
   `parity:api:extra --package activesupport` scores `concurrency/monitor.ts`
   as `1 novel, 1 moved [no Rails counterpart]` — no Rails file maps onto it.
   Rails _includes_ `MonitorMixin` and never declares it.
2. **MRI counterpart.** `vendor/ruby/ext/monitor/lib/monitor.rb:200`
   (`def mon_synchronize`) and `:203` (`alias synchronize mon_synchronize`),
   plus the C half at `vendor/ruby/ext/monitor/monitor.c`. `monitor` is an ext
   bundled inside `ruby/ruby`, so both resolve at the pinned `v3_3_11`.
3. **trails actually calls it.** 3 real consumers outside the file:
   `activerecord/src/connection-adapters/abstract/connection-pool.ts:3,61`
   (`private readonly _mutex: MonitorMixin = { synchronize }`),
   `activerecord/src/connection-adapters/abstract/transaction.ts:12,273`, and
   `activesupport/src/concurrency/load-interlock-aware-monitor.ts`, which is
   built on it. Re-exported at `activesupport/src/index.ts:621`.
4. **It DOES drag a workspace dependency — this is the blocker.**
   `concurrency/monitor.ts:20-24` imports `getAsyncContext`, `type
AsyncContext` and `type AsyncContextAdapter` from
   `../async-context-adapter.js`. That is the same `*-adapter.ts` platform
   family RFC 0089 ruled out and RFC 0129's Non-goals re-affirm (fs/os/crypto),
   and it breaks ruby-compat's leaf rule (README §4) exactly the way
   `getCrypto()` blocks `Tempfile`. The dependency is load-bearing rather than
   incidental: the whole point of the port is that Ruby's monitor is owned by a
   Thread and ours is owned by an async chain, via an AsyncContext-token scheme.

So this story is **blocked on the platform-adapter question**, and it is a
_wider_ instance of it than `ruby-named-file-dir-fileutils-facade` covers:
that story settles `fs`/`path` (recommended shape: ruby-compat owns the
Ruby-named surface plus its own `registerFsBackend()`, and activesupport's
`registerFsAdapter` forwards into it). The same shape applied to
`async-context-adapter.ts` would unblock this one — a
`registerAsyncContextBackend()` in ruby-compat that activesupport's
`registerAsyncContextAdapter` forwards into. Whether that generalization is
right is the decision this story waits on; do not invent a second idiom.

`deps` is set to `ruby-named-file-dir-fileutils-facade` because that story is
where the adapter-in-a-leaf shape gets settled, not because `Monitor` needs
`File`. If the maintainer would rather settle the async-context adapter under
its own story, refile that prerequisite first and re-point the dep.

## Acceptance criteria

- **Precondition:** the platform-adapter-in-a-leaf shape is settled by
  `ruby-named-file-dir-fileutils-facade` (or a successor that covers
  `async-context-adapter.ts`). If it is not, `pnpm tasks block` this story with
  that specific blocker rather than reaching for a workspace import in
  `ruby-compat`.
- `MonitorMixin` / `Monitor` / `synchronize` live under
  `packages/ruby-compat/src/`, with resolving
  `vendor/ruby/ext/monitor/lib/monitor.rb:200,203` citations and a
  `@noRailsEquivalent PERMANENT` receipt on every export.
- `packages/ruby-compat` still has no `dependencies` block: the AsyncContext
  backend is registered INTO ruby-compat by activesupport, never imported out
  of it.
- `activesupport/src/concurrency/monitor.ts` becomes a re-export shim;
  `index.ts:621` still exports `synchronize`, `Monitor` and `MonitorMixin`, and
  both activerecord consumers plus `load-interlock-aware-monitor.ts` are
  untouched.
- `synchronize`'s `NO_JS_CALL_FORM` entry (`compare.ts:249`) is **not** removed
  by this story; state in the PR body whether it now could be, as input to
  `retire-no-js-call-form-entries-and-fetch-receipts`.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the exports actually added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
