---
title: "AbstractRenderer#partialPath raises a bare Error, not ArgumentError"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
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

Surfaced while converging the RFC 0113 `raise-class` verdict in PR #7606. The
ten listed `ArgumentError` rows are done; this is an eleventh site in the same
file that the arm report does not flag, because the port raises where Rails
raises — it just raises a bare `Error`.

`AbstractRenderer#partial_path`
(`vendor/rails/actionview/lib/action_view/renderer/abstract_renderer.rb:82`):

```ruby
path = if object.respond_to?(:to_partial_path)
  object.to_partial_path
else
  raise ArgumentError.new("'#{object.inspect}' is not an ActiveModel-compatible object. It must implement #to_partial_path.")
end
```

`packages/actionview/src/renderer/abstract-renderer.ts#partialPath` throws:

```ts
throw new Error(
  `'${String(model)}' is not an ActiveModel-compatible object. It must implement #toPartialPath.`,
);
```

Two divergences: the class (bare `Error` vs `ArgumentError`) and the
interpolation (`String(model)` vs Ruby's `object.inspect`). The two sibling
raises in the same file — `raise_invalid_identifier` and
`raise_invalid_option_as` — were converged to `ArgumentError` in #7606, so this
one is now the odd raise out.

Note the message quotes `#to_partial_path`, the Ruby method name, in both
Rails and trails; per `docs/ruby-ts-conventions.md` that quoted Ruby spelling
is the one thing here that should NOT be re-spelled — check whether the
existing `#toPartialPath` in the TS string is itself drift before touching it.

## Converged shape

`throw new ArgumentError(...)` from `@blazetrails/ruby-compat` (the class the
rest of the file now uses), with the operand rendered through the repo's Ruby
`inspect` analogue rather than `String()`.

## Acceptance criteria

- [ ] `partialPath`'s non-`toPartialPath` arm raises `ArgumentError`.
- [ ] The interpolated operand matches Ruby's `object.inspect` rendering.
- [ ] `pnpm lint`, `pnpm parity:api:calls` and `pnpm parity:api:extra:gate`
      stay green; no baseline row added.
