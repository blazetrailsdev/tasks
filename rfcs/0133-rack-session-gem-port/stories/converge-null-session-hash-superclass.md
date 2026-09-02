---
title: "NullSessionHash must subclass Rack::Session::Abstract::SessionHash, not ActionDispatch::Request::Session"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 26
pr: 7404
claim: "2026-09-02T20:13:34Z"
assignee: "converge-null-session-hash-superclass"
blocked-by: null
closed-reason: null
---

## Context

Rails' `NullSessionHash` subclasses the RACK session hash:

```ruby
class NullSessionHash < Rack::Session::Abstract::SessionHash
```

(`vendor/rails/actionpack/lib/action_controller/metal/request_forgery_protection.rb:270`.)

trails' subclasses `ActionDispatch::Request::Session` instead
(`packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:60`,
`export class NullSessionHash extends Session`). `Session` is a different class
with a different superclass, a different constructor signature and a different
member set, so the inherited behaviour `NullSessionHash` overrides is not the
behaviour Rails' overrides.

Surfaced while porting `Session#inspect`'s `self.class` arm in PR #7384: the
inheritance edge is what made `NullSessionHash` render a Session-shaped
`inspect` in the first place.

## Converged shape

`packages/rack-session/src/abstract/id.ts` already exports `SessionHash`
(`rack-session/lib/rack/session/abstract/id.rb:26`), which is what
`request-forgery-protection.ts` should extend. Check what `NullSessionHash`'s
own body relies on from the current superclass before flipping the edge —
`request_forgery_protection.rb:271-289` overrides `[]`, `[]=`, `to_hash`,
`exists?` and leaves the rest to `SessionHash`.

## Acceptance criteria

- `NullSessionHash extends SessionHash` from `@blazetrails/rack-session`,
  matching `request_forgery_protection.rb:270`.
- Its overridden members keep the Rails names and bodies
  (`request_forgery_protection.rb:271-289`).
- `pnpm parity:api` actionpack inheritance figure non-negative;
  `pnpm parity:test` non-negative.
