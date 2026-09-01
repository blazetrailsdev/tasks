---
title: "port-rack-session-pool"
status: ready
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
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

`relocate-rack-session-scaffolding-out-of-actionpack` expected to move a
`Pool` class out of
`packages/actionpack/src/action-dispatch/middleware/session/pool.ts`, which PR #7317 was to have added. #7317 landed without it — there is no `Pool` anywhere
in `packages/actionpack/src`, so the relocation had nothing to move and the
gem's `Rack::Session::Pool` is still unported.

Its absence is visible in the call-set baseline: with `pool.rb` unported, the
comparer cross-matches its concrete `find_session` / `delete_session`
(`vendor/rack-session/lib/rack/session/pool.rb:37-44`, `:60-70`) onto
`Persisted`'s abstract `raise` hooks in
`packages/rack-session/src/abstract/id.ts`, which is what the two `generate_sid`
rows in
`scripts/api-compare/call-mismatches-exclude/rack-session/abstract/id.json`
record. Porting `Pool` retires both rows.

Anchor: `vendor/rack-session/lib/rack/session/pool.rb:26-76`
(`Pool < Abstract::PersistedSecure`, `DEFAULT_OPTIONS`, `initialize`,
`find_session`, `write_session`, `delete_session`). Its Rails-side test is
`vendor/rack-session/test/spec_session_pool.rb` (17 tests), which
`parity:test --package rack-session` already maps to
`packages/rack-session/src/pool.test.ts`.

## Acceptance criteria

- `Pool` lives at `packages/rack-session/src/pool.ts`, mirroring
  `pool.rb:26-76` method for method, and is exported from
  `packages/rack-session/src/index.ts`.
- Nothing in `packages/rack-session` imports from `@blazetrails/actionpack`.
- The two `generate_sid` rows in
  `scripts/api-compare/call-mismatches-exclude/rack-session/abstract/id.json`
  are deleted (they exist only because `pool.rb` had no TS counterpart), and
  the resulting stale mark is narrowed with `pnpm parity:api:calls:tighten`,
  never reseeded.
- `pnpm parity:api` deltas are non-negative; `parity:api:calls`,
  `parity:api:calls:args` and `parity:api:params` show no new rows.
