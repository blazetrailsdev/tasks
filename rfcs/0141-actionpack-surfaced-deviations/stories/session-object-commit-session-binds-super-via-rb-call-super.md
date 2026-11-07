---
title: "SessionObject#commitSession hardcodes Persisted.prototype as super"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Session::SessionObject#commit_session`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/session/abstract_store.rb:72-75`)
calls `super`. In trails, `SessionObject.commitSession`
(`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`) calls
`Persisted.prototype.commitSession.call(this, …)` directly, so it binds `super` to `Persisted`
whatever the includer's ancestry is. `AbstractSecureStore`, whose parent is `PersistedSecure`, is
one such includer.

trails#9820 fixed the same pattern in `StaleSessionCheck#extract_session_id` / `#load_session`.
There the hardcoded call skipped `PersistedSecure#extract_session_id`
(`vendor/rack-session/v2.1.0/lib/rack/session/abstract/id.rb:483-486`), and `CacheStore` never
found a stored session. `commitSession` has no observable bug today, because `PersistedSecure`
does not override `commit_session`. The shape is still wrong, though, and it would break as soon
as anything between the includer and `Persisted` overrides `commit_session`.

## Acceptance criteria

- `SessionObject.commitSession` reaches the next method through
  `rbCallSuper(this, SessionObject.commitSession, req, res)`, as `StaleSessionCheck` does after
  trails#9820.
- Every `*.prototype.X.call(this, …)` super stand-in left in `abstract-store.ts` is converged the
  same way.
- The session tests (`dispatch/session/*.test.ts`, `middleware/session/*.test.ts`) stay green.
