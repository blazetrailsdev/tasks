---
title: "Port Rack::Session::Abstract::SessionHash and SecureSessionHash against the vendored source"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["relocate-rack-session-scaffolding-out-of-actionpack"]
deps-rfc: []
est-loc: 450
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Abstract::SessionHash`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:50-236`, 186 lines, 34
methods) is named across trails today with nothing behind it:
`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:54`
points at it as the Rails analogue of trails' session object, and
`0104-twitter-app-full-stack-integration/session-and-flash-lifecycle`'s Context
calls it "the missing type". PR 7317 sidestepped it by hard-coding
`sessionClass()` to return `ActionDispatch::Request::Session`.

Both belong in the tree, and they are different classes. Rails'
`Persisted#session_class` (`abstract/id.rb:431-433`) returns `SessionHash`;
`ActionDispatch::Session::AbstractStore` overrides it to return
`Request::Session` (`vendor/rails/actionpack/.../request/session.rb`). So this
story ports `SessionHash` into the gem package where it belongs and **leaves
the actionpack override alone** — it is the Rails behaviour.

Also in scope: `PersistedSecure::SecureSessionHash`
(`abstract/id.rb:461-476`), which subclasses it and overrides `[]`.

This is where the RFC's fidelity claim is cashed: 25 of the gem's 124 tests
cover these two classes directly
(`spec_session_abstract_session_hash.rb`, 14 tests;
`spec_session_abstract_persisted_secure_secure_session_hash.rb`, 11), so the
port is checkable rather than asserted. Enrolling those files is
`enroll-rack-session-test-suite`; port the bodies here so that story has
something to credit.

Ruby-idiom traps present in this body specifically: `fetch(key, default =
Unspecified, &block)` (`:98`) is Ruby `fetch` semantics, not `??`;
`stringify_keys` (`:200`) and `to_hash` (`:130`) are value-returning; `exists?`
(`:159`) / `loaded?` (`:165`) / `empty?` (`:169`) are predicates whose Ruby
return value is used, not just tested.

## Acceptance criteria

- `SessionHash` and `SecureSessionHash` live in
  `packages/rack-session/src/abstract/id.ts` with per-method
  `vendor/rack-session/lib/rack/session/abstract/id.rb:LINE` citations.
- `Persisted#sessionClass` returns `SessionHash`, matching
  `abstract/id.rb:431-433`; `ActionDispatch::Session::AbstractStore` keeps its
  override returning `Request::Session`, and a test pins both.
- No method is added that the gem does not define
  (`pnpm parity:api:extra --package rack-session`).
- `parity:api` for `rack-session` improves; `parity:api:calls` /
  `:calls:args` / `:params` add no rows.
- actionpack deltas non-negative — nothing there changes except, if needed, the
  one `sessionClass` override.
