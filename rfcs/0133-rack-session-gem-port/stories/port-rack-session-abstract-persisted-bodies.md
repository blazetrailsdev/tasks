---
title: "Converge the relocated Persisted bodies against abstract/id.rb now that the source is readable"
status: draft
updated: 2026-08-31
rfc: "0133-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["relocate-rack-session-scaffolding-out-of-actionpack"]
deps-rfc: []
est-loc: 500
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Persisted` and `PersistedSecure` were written before the gem was vendored:
PR 7317 ported `#call` / `#context` / `#commit_session` and friends from a
citation (`rack-session-2.1.0/lib/rack/session/abstract/id.rb:239-497`) that
resolved against nothing, and `main` before it had four bodies that were bare
`NotImplementedError` throws. After
`relocate-rack-session-scaffolding-out-of-actionpack` the source is on disk at
`vendor/rack-session/lib/rack/session/abstract/id.rb`, so every body can be
read line for line for the first time. This story does that pass.

`Persisted` is `abstract/id.rb:239-458` — 25 methods:

```
initialize :257   call :267   context :271   make_request :282
initialize_sid :286   generate_sid :296   prepare_session :309
load_session :320   extract_session_id :328   current_session_id :336
session_exists? :342   commit_session? :350   loaded_session? :359
forced_session_update? :363   force_options? :367   security_matches? :371
commit_session :381   cookie_value :416   set_cookie :423   session_class :431
find_session :440   write_session :448   delete_session :455
```

`PersistedSecure` is `:460-497` (`generate_sid` `:477`, `extract_session_id`
`:483`, `session_class` `:490`, `cookie_value` `:494`).

Specific things to check, each a known divergence class:

- The three `@nie disposition=TODO` markers PR 7317 leaves on `findSession` /
  `writeSession` / `deleteSession` mirror Ruby bodies that genuinely raise
  (`abstract/id.rb:440-457` — `raise '#find_session not implemented.'`). Give
  them a real disposition and a `rails=rack-session/lib/rack/session/abstract/id.rb:LINE`
  anchor, or convert them to the exact Ruby raise. A `TODO` disposition with no
  path is the anchorless ledger this RFC exists to remove.
- `commit_session?` (`:350`), `forced_session_update?` (`:363`) and
  `force_options?` (`:367`) are Ruby predicates whose **value** is used by
  `commit_session`; port both arms, not a `boolean` narrowing.
- `generate_sid(secure = @sid_secure)` (`:296`) has a default that a TS default
  parameter will swallow when a caller forwards an explicit `undefined`.
- `Pool#generate_sid(*args, use_mutex: true)` (`pool.rb:37`) — PR 7317 drops
  the mutex, correctly (one JS body runs to completion); keep that decision and
  its note, and check the `use_mutex: false` arm at `pool.rb:71`
  (`get_session_with_fallback`) is not lost with it.

`spec_session_abstract_persisted.rb` (12 tests) and `spec_session_pool.rb`
(17 tests) are the check; enrolling them is `enroll-rack-session-test-suite`.

## Acceptance criteria

- Every method of `Persisted` / `PersistedSecure` / `Pool` in
  `packages/rack-session/src/` carries a resolving `:LINE` citation, and the
  set of methods matches the Ruby list above — no extras, no omissions beyond
  ones a `@missingRailsCall` / `@missingRailsArgs` receipt covers.
- Zero `@nie disposition=TODO` markers remain in `packages/rack-session/`.
- `pnpm parity:api` for `rack-session` improves; `parity:api:calls`,
  `:calls:args` and `:params` add no rows, and any mark staled by a
  convergence is tightened per shard, never reseeded.
- actionpack deltas non-negative.
