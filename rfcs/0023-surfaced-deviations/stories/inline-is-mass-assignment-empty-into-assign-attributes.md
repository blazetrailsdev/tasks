---
title: "isMassAssignmentEmpty is invented surface; Rails inlines the guard as attribute_assignment.rb:32"
status: draft
updated: 2026-08-26
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7084 while enrolling `activemodel` in
`unbacked-internal-needs-receipt` (RFC 0121).

`packages/activemodel/src/attribute-assignment.ts` carries a trails-invented
helper, `isMassAssignmentEmpty(attrs)`, that Rails does not have. Rails spells
the same guard inline, as one line of `assign_attributes`:

```ruby
# activemodel/lib/active_model/attribute_assignment.rb:28-35
def assign_attributes(new_attributes)
  unless new_attributes.respond_to?(:each_pair)
    raise ArgumentError, "When assigning attributes, you must pass a hash as an argument, #{new_attributes.class} passed."
  end
  return if new_attributes.empty?          # :32

  _assign_attributes(sanitize_for_mass_assignment(new_attributes))
end
```

The helper exists because trails' `ActionController::Parameters` stand-in does
not answer `empty?` the way Ruby's does: the wrapper holds its parameters in a
private store (`actionpack/lib/action_controller/metal/strong_parameters.rb:250`),
so a bare `Object.keys(attrs).length` counts the wrapper's own instance fields
(`parameters`, `_permitted`) instead of its parameter count, and an EMPTY
unpermitted wrapper would read as non-empty. The helper consults a `empty`
delegate when present and falls back to the key count otherwise.

PR #7084 recorded this with a `@noRailsEquivalent CONVERGEABLE` receipt. That
receipt is the debt; this story is the convergence. Extra surface is measured —
see `pnpm parity:api:extra`.

## Converged shape

Give the `Parameters` port a real `empty?` (`isEmpty`, per
`docs/ruby-ts-conventions.md`) so the receiver answers the question Ruby asks it,
then delete `isMassAssignmentEmpty` and inline the guard as Rails writes it —
one `return` at the head of `assignAttributes`, mirroring
`attribute_assignment.rb:32`. `packages/activesupport/src/ruby-empty.ts`'s
`isEmpty` already exists as the Ruby-core `empty?` spelling and is the call to
make, so the ported body emits the call the RFC 0047 call-set gate credits.

## Acceptance criteria

- [ ] `isMassAssignmentEmpty` is deleted from
      `packages/activemodel/src/attribute-assignment.ts`, along with its
      `@noRailsEquivalent` receipt and `@internal` tag.
- [ ] `assignAttributes` carries the guard inline, in Rails' branch order:
      the `respond_to?(:each_pair)` / `ArgumentError` arm first, then the
      empty-return, then `_assignAttributes(sanitizeForMassAssignment(...))`.
- [ ] An empty UNPERMITTED params-like wrapper is still a no-op — add the
      regression case if none covers it, and confirm it fails without the fix.
- [ ] `pnpm parity:api:extra --package activemodel` no longer lists the name,
      `pnpm parity:api:calls` is green, and `pnpm parity:api` deltas are
      non-negative.
