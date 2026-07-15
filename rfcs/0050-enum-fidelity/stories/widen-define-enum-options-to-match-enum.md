---
title: "Widen defineEnum's options to match _enum (scopes/instanceMethods/validate/default)"
status: draft
updated: 2026-07-15
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR 4890 (converge-cat-enum-declaration-to-array-form), which fixed
exactly this class of bug one layer up.

That PR found the public `enum` macro typed its values parameter as a hash only,
so no model could use Rails' array form even though `_enum` normalized arrays at
runtime; 25 call sites in `enum.test.ts` papered over it with `as any`.

`defineEnum` (`packages/activerecord/src/enum.ts:212`) has the sibling narrowness in its
_options_ parameter:

```ts
options?: { prefix?: boolean | string; suffix?: boolean | string },
```

It delegates to `_enum` (same file), whose options are
`prefix`/`suffix`/`scopes`/`instanceMethods`/`validate`/`default`. So
`defineEnum(K, "status", ["a", "b"], { validate: true })` is a type error while
working at runtime — the same trap that produced the `as any` casts, and the same
pressure to reach for a cast rather than fix the type.

Distinct from the closed `enum-macro-attribute-options-full-passthrough`, which
concerns `_enum`'s `attributeOptions` (`{ default? }`) passthrough into
`attribute(name, **options)` per `vendor/rails/activerecord/lib/active_record/enum.rb:238`.
This one is the `defineEnum` macro-options surface.

## Acceptance criteria

- `defineEnum`'s `options` matches `_enum`'s (prefix, suffix, scopes,
  instanceMethods, validate, default).
- No `as any` needed at any `defineEnum` call site for a supported option; grep
  `defineEnum(` call sites and drop casts the widening makes obsolete, so the
  sites land under the type checker (that is what makes the change verifiable).
- `pnpm typecheck` clean; type-virtualization fixtures 07/14/18/19 still pass.
