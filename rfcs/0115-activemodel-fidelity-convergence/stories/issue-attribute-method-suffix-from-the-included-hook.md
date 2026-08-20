---
title: "issue-attribute-method-suffix-from-the-included-hook"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6796
claim: "2026-08-20T22:43:51Z"
assignee: "issue-attribute-method-suffix-from-the-included-hook"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attributes.ts` and `packages/activemodel/src/model.ts`
still hard-code `attributes.rb:35-37`'s

```ruby
included do
  attribute_method_suffix "=", parameters: "value"
end
```

as a literal second entry in `Model`'s static initializer
(`model.ts:293-295`, `new AttributeMethodPattern({ suffix: "=", parameters: "value" })`),
rather than issuing it from the symbol-keyed `[included]` hook that
`include()` fires (`packages/activesupport/src/include.ts:193,272,371`).

This was carved out of `converge-attributes-define-method-attribute-and-defaults`
(PR that also deleted `buildDefaultAttributes` and inlined `typeOptions`)
because it is not a local edit: `Model` does not currently `include()`
`Attributes` at all — it composes the statics by hand
(`model.ts:317-330`). Issuing the suffix from `[included]` means first
converting `Model` onto `include()` / `Included<>` for `Attributes`, which
is its own refactor with its own blast radius across
`attribute-methods.ts`, `attribute-registration.ts` and every AR host.

See RFC 0115 finding F0: activemodel has **zero** callers of
`classAttribute()`, `extend()`/`Extended<>` and `include()`/`Included<>`
today, all three of which are ported and exported.

## Acceptance criteria

- `Model` gets `Attributes`' instance + class halves through
  `include()` / `Extended<>` rather than by hand-assigned statics.
- `attributes.rb:35-37`'s `attribute_method_suffix "=", parameters: "value"`
  is issued from the `[included]` hook, not hard-coded into
  `Model._attributeMethodPatterns`.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
