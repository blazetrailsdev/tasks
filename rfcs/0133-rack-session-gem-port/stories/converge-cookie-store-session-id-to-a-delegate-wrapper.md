---
title: "Converge CookieStore::SessionId from a subclass to a DelegateClass wrapper, dropping the any-typed cookieValue override"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 7336
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails:

    class SessionId < DelegateClass(Rack::Session::SessionId)
      attr_reader :cookie_value
      def initialize(session_id, cookie_value = {})
        super(session_id)
        @cookie_value = cookie_value
      end
    end

`vendor/rails/actionpack/lib/action_dispatch/middleware/session/cookie_store.rb:53-59`.

trails ports it as `class SessionId extends RackSessionId`
(`packages/actionpack/src/action-dispatch/middleware/session/cookie-store.ts:36`) —
a subclass, not a delegating wrapper. The difference was invisible until PR #7328 moved `Rack::Session::SessionId` into `@blazetrails/rack-session` and
brought its `alias :cookie_value :public_id`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:34`) with it.

Ruby's `DelegateClass` builds a NEW class whose methods forward to the wrapped
object, so `attr_reader :cookie_value` freely replaces the delegate's
`cookie_value` — a `String` reader on the delegate, a `Hash` reader on the
wrapper, no constraint between them. TypeScript's `extends` demands an override
be assignable to the base member, and `Record<string, unknown>` is not
assignable to `string`. The port currently buys past that with a widened return
type:

    override get cookieValue(): any {
      return this.#cookieValue;
    }

That `any` is the deviation. It is the only place in either file where the
Rails/Rack seam is papered over rather than modelled, and it silently disables
type checking on every read of `CookieStore::SessionId#cookieValue` — including
`PersistedSecure#cookieValue(data)`
(`abstract/id.rb:494-496`), which is the one consumer that actually depends on
the wrapper's hash rather than the delegate's string.

## Converged shape

Model the delegate as Ruby does: a wrapper holding a `Rack::Session::SessionId`
and forwarding the delegated surface (`publicId`, `privateId`, `toString`,
`isEmpty`, `inspect`), rather than inheriting it. Its own `cookieValue` is then
an ordinary reader with the honest `Record<string, unknown>` type and no
`override`, because there is nothing to override.

The cost to check before starting: `instanceof RackSessionId` stops answering
true for a `CookieStore::SessionId`. Call sites that rely on it today are
`cookie-store.test.ts:184` and `dispatch/session/cookie-store.test.ts`; Rails
has the same property (a `DelegateClass` instance is not a
`Rack::Session::SessionId`), so those assertions are themselves the deviation
and converge with it.

## Acceptance criteria

- `CookieStore::SessionId` no longer `extends` the Rack `SessionId`; it holds
  one and forwards the delegated members.
- `cookieValue` is typed `Record<string, unknown>` — no `any`, no widened
  override.
- `PersistedSecure#cookieValue` still answers the cookie hash for a
  `CookieStore::SessionId` and the public id for a plain `Rack::Session::SessionId`
  (`abstract/id.rb:494-496` vs `:34`).
- Any `instanceof` assertion that changes answer is converged to match Ruby's,
  not preserved; test names are unchanged.
- `pnpm parity:api` deltas non-negative; `parity:api:calls`,
  `parity:api:calls:args`, `parity:api:params` show no new rows.
