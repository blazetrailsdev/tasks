---
title: "Converge Session#inspect's not-yet-loaded form onto Ruby's self.class path"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 19
pr: 7384
claim: "2026-09-02T12:03:27Z"
assignee: "add-rack-session-to-generate-stubs-pkg-dirs"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request::Session#inspect`
(`vendor/rails/actionpack/lib/action_dispatch/request/session.rb:222-228`) is:

```ruby
def inspect
  if loaded?
    super
  else
    "#<#{self.class}:0x#{(object_id << 1).to_s(16)} not yet loaded>"
  end
end
```

`self.class` interpolates the receiver's own full constant path, so the string
follows the class rather than being fixed at one literal.

trails (`packages/actionpack/src/action-dispatch/request/session.ts`,
`Session#inspect`) hardcodes `ActionDispatch::Request::Session` in both arms.
That renders correctly today only because `Session` has no subclass in Rails —
`NullSessionHash` and `TestSession` (`packages/actionpack/src/action-dispatch/
middleware/request_forgery_protection` / `testing/test-session.ts`) DO subclass
it in trails, and each would render its parent's name.

PR #7344 solved the same `self.class` problem for
`Rack::Session::Abstract::SessionHash` (`rack-session/lib/rack/session/abstract/
id.rb:151-157`) with a module-local `rubyClassPath` switch in
`packages/rack-session/src/abstract/id.ts` that maps each ported class to its
Ruby constant path; the value then follows the receiver's class the way
`self.class` does. It was left out of scope there because sharing one mechanism
across the two packages would have been new measured surface — but the
actionpack side can carry its own module-local copy, exactly as rack-session
does, with no exported name.

## Acceptance criteria

- `Session#inspect`'s not-yet-loaded arm renders the receiver's own Ruby
  constant path rather than a fixed literal, so a subclass renders its own name.
- The loaded arm is untouched (tracked separately by
  [[session-inspect-loaded-arm-drops-instance-variables]]).
- Whatever carries the Ruby names is not new measured surface: a non-exported
  module-local map, matching `rubyClassPath` in
  `packages/rack-session/src/abstract/id.ts`, or a receipt if it must be a
  member.
- A test pins the string for `Session` and for at least one subclass.
- `parity:api` actionpack non-negative; no new `@noRailsEquivalent` receipt.
