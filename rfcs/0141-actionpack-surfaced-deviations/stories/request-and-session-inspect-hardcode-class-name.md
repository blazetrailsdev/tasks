---
title: "Request#inspect / Session#inspect hardcode the class name instead of self.class.name"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request#inspect` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:484-486`)
renders `#<#{self.class.name} …>`. trails' `packages/actionpack/src/action-dispatch/http/request.ts`
`inspect` hardcodes `#<ActionDispatch::Request …>`, so a subclass inspects under the parent's name.
`Request::Session#inspect` (`request/session.rb:227-233`) has the same split in trails
(`request/session.ts` `inspect`): the loaded arm hardcodes `ActionDispatch::Request::Session`
while the unloaded arm uses `this.constructor.name`, which answers the bare JS name `Session`
for the base class.

## Converged shape

Both render the Ruby-qualified class name of the receiver's class, so a subclass shows its own
name and the base classes show `ActionDispatch::Request` / `ActionDispatch::Request::Session`.
Use the repo's existing Ruby-namespace convention for class names (e.g. `static override name`
as `InheritableOptions` does, or activemodel's `rubyNamespace`) rather than a literal string.

## Acceptance criteria

- `Request#inspect` and both arms of `Session#inspect` read the receiver's Ruby class name.
- `RequestInspectTest#test_inspect` and the session inspect trails tests stay green, and a
  subclass inspects under its own name.
