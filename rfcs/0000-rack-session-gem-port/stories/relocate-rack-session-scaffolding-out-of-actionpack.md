---
title: "Move Persisted, PersistedSecure, SessionId and Pool out of actionpack into rack-session behind a re-export shim"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session", "actionpack"]
deps: ["enroll-rack-session-in-compare-tooling"]
deps-rfc: []
est-loc: 550
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 4, and the one that pays the RFC off. **Land it only after PR 7317
merges** — that PR is `in-progress` on
`0104-twitter-app-full-stack-integration/session-and-flash-lifecycle` and is
actively rewriting the files this story moves. Do not block it; move what it
lands.

What moves, with its anchor at `vendor/rack-session/lib/rack/session/`:

| TS today | Ruby |
| --- | --- |
| `SessionId` (`.../session/abstract-store.ts:21`) | `abstract/id.rb:21-44` |
| `Persisted` (`abstract-store.ts:71` on main, rewritten by 7317) | `abstract/id.rb:239-458` |
| `PersistedSecure` (`abstract-store.ts:102`) | `abstract/id.rb:460-497` |
| `DEFAULT_OPTIONS` (added by 7317) | `abstract/id.rb:240-253` |
| `ResponseRaw` (added by 7317) | `abstract/id.rb:275` (`Rack::Response::Raw`) |
| `Pool` (`.../session/pool.ts`, 84 lines, added by 7317) | `pool.rb:26-76` |

Target files: `packages/rack-session/src/abstract/id.ts` and
`packages/rack-session/src/pool.ts`.

What **stays in actionpack** — each verified against
`vendor/rails/actionpack/lib/action_dispatch/middleware/session/`, which holds
exactly four `.rb` files:

- `AbstractStore`, `AbstractSecureStore`, `Compatibility`, `StaleSessionCheck`,
  `SessionObject`, `SessionRestoreError` — `abstract_store.rb:12-104`.
- `CookieStore` and its `SessionId < DelegateClass(Rack::Session::SessionId)` —
  `cookie_store.rb:52-53`. The delegate wrapper is Rails', the delegated class
  is Rack's; only the latter moves.
- `CacheStore`, `MemCacheStore`, `resolve-store.ts`
  (`action_dispatch.rb:113-124`), `ActionDispatch::Request::Session`
  (`request/session.rb`).

Moving any of those would destroy `parity:api` coverage that works today — the
inverse of the problem. Verify each class's `.rb` counterpart before assigning
it a side.

Shape (RFC 0129's `move-tempfile-to-ruby-compat` is the precedent):

- New files in `packages/rack-session/src/`, every member carrying a
  `vendor/rack-session/lib/rack/session/<file>.rb:LINE` citation that resolves.
  No `@noRailsEquivalent` receipts are needed for members the gem defines —
  that is the whole point of the anchor. PR 7317's `ResponseRaw`
  `@noRailsEquivalent PERMANENT` receipt is deleted in favour of a citation to
  `abstract/id.rb:275`, unless the TS shape genuinely diverges from
  `Rack::Response::Raw`, in which case the receipt stays and says so.
- `abstract-store.ts` keeps only the Rails classes and re-exports the moved
  names from `@blazetrails/rack-session`, so no importer changes here and the
  move is independently revertible. `delete-rack-session-reexport-shims`
  removes the shim.
- Tests move with the code and keep their names. A test file that is
  **Rails-anchored** (matched by `parity:test` against
  `abstract_store_test.rb`) STAYS in actionpack — moving it would make the
  actionpack `parity:test` delta negative. `abstract-store.test.ts` (172 lines
  on main, extended by 7317) will need splitting on that line.
- Nothing in `packages/rack-session` may import from `@blazetrails/actionpack`.
  If a moved body reaches back into actionpack (`Request`, `RequestSession`),
  that is a signal the Rails/Rack seam is drawn in the wrong place: `Persisted`
  in the gem calls `session_class` (`abstract/id.rb:431-433`), which returns
  `SessionHash`, and it is the Rails subclass that overrides it to
  `Request::Session`. Keep the override in actionpack.

## Acceptance criteria

- `Persisted`, `PersistedSecure`, `SessionId`, `DEFAULT_OPTIONS`, `ResponseRaw`
  and `Pool` live under `packages/rack-session/src/`, each with a resolving
  `vendor/rack-session/...:LINE` citation.
- `packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`
  and `.../pool.ts` are re-export shims; every importer and the
  `@blazetrails/actionpack` public surface are unchanged.
- `packages/rack-session` imports nothing from `@blazetrails/actionpack`.
- `pnpm parity:api` shows the moved methods now matching against
  `abstract/id.rb` / `pool.rb`; actionpack's `parity:api:extra` novel count
  drops by the six moved names and `parity:test` deltas are non-negative on
  both packages.
- `parity:api:calls`, `parity:api:calls:args`, `parity:api:params` show no new
  rows. Converging a body against the now-readable source may stale a mark —
  tighten the named shard, never reseed.
- No `@nie` marker in either package names a path that does not exist.
