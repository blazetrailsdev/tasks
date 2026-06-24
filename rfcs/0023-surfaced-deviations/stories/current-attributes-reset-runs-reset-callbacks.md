---
title: "CurrentAttributes#reset must run :reset callbacks (run_callbacks :reset)"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4083
claim: "2026-06-24T20:07:01Z"
assignee: "current-attributes-reset-runs-reset-callbacks"
blocked-by: null
---

## Context

Surfaced during RFC 0044 cross-package call-mismatch triage (PR #4078).
trails `CurrentAttributes.reset` (activesupport/src/current-attributes.ts:94-97)
just deletes the per-class instance:

```ts
static reset(): void {
  const ctor = this as unknown as CurrentAttributesClass;
  ctor._instances.delete(ctor);
}
```

Rails' `ActiveSupport::CurrentAttributes#reset` wraps the reset in callbacks:

```ruby
def reset
  run_callbacks :reset do
    self.attributes = {}
  end
end
```

The class already declares a `_resetCallbacks: ResetCallback[]` field
(current-attributes.ts:29) but `reset()` never invokes it — registered
before-reset callbacks silently never fire. This is a real behavioral
deviation, not a name-collision (the call-mismatch flag for
`reset → run_callbacks` is a true positive; it remains tracked in the
wide RFC 0047 gate baseline, call-mismatches-wide-exclude.json).

## Acceptance criteria

- `CurrentAttributes.reset` runs the registered `:reset` callbacks around
  the attribute clear, mirroring `run_callbacks :reset` (Rails
  current_attributes.rb).
- A `before_reset`/`after_reset`-equivalent registration fires when `reset`
  is called; add a test matching the Rails CurrentAttributes reset-callback
  test name verbatim.
- Confirm the `_resetCallbacks` field is actually wired (or replace it with
  the real callback mechanism).
