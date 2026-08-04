---
title: "Route hasSecureToken through generateUniqueSecureToken"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6096
claim: "2026-08-04T21:59:03Z"
assignee: "port-compare-with-range"
blocked-by: null
closed-reason: null
---

## Context

Found by the `activerecord-unrouted-privates-drop-carried-arguments` sweep
(PR #5419), which fixed the check-constraint cluster and inventoried the rest.

`packages/activerecord/src/secure-token.ts` ports
`generate_unique_secure_token` (secure_token.rb:57) as a bare exported
function, but **nothing routes through it** — it has zero call sites, and it is
not wired onto `Base` as a class method at all.

Rails calls it twice inside `has_secure_token`, both times on `self.class` so a
model can override it (secure_token.rb:51-56):

```ruby
define_method("regenerate_#{attribute}") { update! attribute => self.class.generate_unique_secure_token(length: length) }
set_callback on, on == :initialize ? :after : :before do
  if new_record? && !query_attribute(attribute)
    send("#{attribute}=", self.class.generate_unique_secure_token(length: length))
  end
end
```

trails' `hasSecureToken` instead calls the module-private `generateToken(tokenLength)`
directly at both sites (secure-token.ts:77 and :94). Consequences:

- `generateUniqueSecureToken` is dead code — its `length` parameter is never
  exercised from any caller.
- Overriding `generateUniqueSecureToken` on a model, a documented Rails
  extension point, has no effect in trails.

## Complication

`hasSecureToken` is deliberately NOT a `Base` static — it lives behind the
`@blazetrails/activerecord/secure-token` subpath because it needs crypto
(index.ts:309). So "wire the ClassMethods module onto Base" is not available
as-is; decide between installing the static from within `hasSecureToken` (own
property, so a later subclass override still wins) versus relocating the
crypto dependency. Settle that before implementing.

## Acceptance criteria

- Both call sites in `hasSecureToken` dispatch through the record's class, not
  the module-private helper, so a model-level override is honoured.
- A test asserting an overridden `generateUniqueSecureToken` is actually used
  by both the create callback and `regenerate<Attr>` — not merely that a token
  of the right length comes back.
- Test verified to FAIL before the fix.
- Any wide-baseline entry that converges is removed; baseline only shrinks.
