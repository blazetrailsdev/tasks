---
title: "Converge SessionHash#inspect's not-yet-loaded form onto Ruby's full self.class path"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7344
claim: "2026-09-01T17:30:06Z"
assignee: "converge-session-hash-inspect-onto-full-class-path"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Abstract::SessionHash#inspect`
(`vendor/rack-session/lib/rack/session/abstract/id.rb:151-157`) is:

```ruby
def inspect
  if loaded?
    @data.inspect
  else
    "#<#{self.class}:0x#{self.object_id.to_s(16)} not yet loaded>"
  end
end
```

`self.class` interpolates the FULL Ruby constant path, so the not-yet-loaded
form reads `#<Rack::Session::Abstract::SessionHash:0x... not yet loaded>`, and
for the subclass `#<Rack::Session::Abstract::PersistedSecure::SecureSessionHash:0x... not yet loaded>`.

trails (`packages/rack-session/src/abstract/id.ts`, `SessionHash#inspect`,
landed in PR #7335) interpolates `this.constructor.name`, which is the bare
`SessionHash` / `SecureSessionHash` — a TS class carries no namespace. The
subclass arm is why a hardcoded string is not the fix on its own: the name has
to follow the receiver's class, which is exactly what `self.class` does.

`ActionDispatch::Request::Session#inspect`
(`packages/actionpack/src/action-dispatch/request/session.ts`) has the same
shape and solved it by hardcoding the one Ruby path it needs, so it does not
answer the subclass case either.

## Acceptance criteria

- `SessionHash#inspect`'s not-yet-loaded form renders the full Ruby constant
  path, and `SecureSessionHash` renders its own — the value follows the
  receiver's class the way `self.class` does, rather than being fixed at one
  literal.
- The loaded arm is unchanged (`@data.inspect`, already `inspect()` from
  `@blazetrails/activesupport`).
- A test pins both classes' not-yet-loaded strings.
- Whatever carries the Ruby name is not new measured surface: either a
  non-exported module-local map, or a receipt if it must be a member.
- Consider whether `ActionDispatch::Request::Session#inspect`'s hardcoded path
  converges onto the same mechanism; if it does, converge it, otherwise leave
  it and say why.
