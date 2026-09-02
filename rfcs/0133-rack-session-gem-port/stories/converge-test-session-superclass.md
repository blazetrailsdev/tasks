---
title: "converge-test-session-superclass"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7408
claim: "2026-09-02T21:09:05Z"
assignee: "converge-test-session-superclass"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestSession` subclasses the rack session hash:

```ruby
class TestSession < Rack::Session::Abstract::PersistedSecure::SecureSessionHash # :nodoc:
```

(`vendor/rails/actionpack/lib/action_controller/test_case.rb:196-205`.)

trails' `TestSession` (`packages/actionpack/src/action-controller/test-case.ts:718`)
is a standalone class with a `Map`-backed `_data` and no superclass at all, so
none of the `SecureSessionHash` behaviour Rails' overrides sit on top of is
inherited — `destroy` and `load!` are overridden in Rails precisely BECAUSE the
inherited bodies call the `@store` a TestSession does not have
(`test_case.rb:194-195`).

Surfaced by `converge-actionpack-session-subclass-ruby-class-paths`: that story
registered `TestSession`'s Ruby constant path
(`ActionController::TestSession`) in the shared `rubyClassPath` slot, but the
path can only actually RENDER through `SessionHash#inspect`'s not-yet-loaded arm
once `TestSession` inherits it. Today nothing routes there.

`NullSessionHash`'s equivalent edge was flipped in the same PR
(`converge-null-session-hash-superclass`) and is the worked example:
`SessionHash`'s `@data` / `@loaded` became `protected` so the subclass
constructor can seed them the way `initialize` does in Ruby.

## Acceptance criteria

- `TestSession extends SecureSessionHash` from `@blazetrails/rack-session`,
  matching `test_case.rb:196`.
- `initialize`, `exists?`, `keys`, `values`, `destroy`, `load!`, `dig`, `fetch`,
  `id`, `enabled?` and the rest keep the Rails names and bodies
  (`test_case.rb:196-260`), dropping any trails-only member the inherited
  `SessionHash` already supplies.
- `TestSession#inspect` renders `#<ActionController::TestSession:0x… not yet
loaded>` through the inherited arm, and a test pins it.
- `pnpm parity:api` actionpack inheritance figure non-negative;
  `pnpm parity:test` non-negative.
