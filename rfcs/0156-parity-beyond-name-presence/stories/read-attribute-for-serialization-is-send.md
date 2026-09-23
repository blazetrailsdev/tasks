---
title: "Converge read_attribute_for_serialization to Rails' alias of send"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `read_attribute_for_serialization` as `alias :read_attribute_for_serialization :send` (`activemodel/lib/active_model/serialization.rb:163`). It is a plain `send` of the key.

trails' `readAttributeForSerialization` (`packages/activemodel/src/serialization.ts`) does more:

- It probes the `_attributes` store for `fetchValue` / Map shapes.
- It returns a non-function property directly.
- It consults the store's `keys()` before falling back to invoking a method.
- It raises `NoMethodError` only after all of that.

That makes the port a two-source lookup where Rails dispatches exactly once. For example, a store value can shadow a same-named method that `send` would call, and the order of the checks decides which one wins. trails#8005 made the helper `this`-typed but kept the body.

The converged shape is `send`: read the member off `this`, calling it if it is a method (generated readers are properties, per CLAUDE.md § "Generated attribute readers are properties"), and raise `NoMethodError` as `send` does when nothing answers. Use ruby-compat's send port if one exists.

## Acceptance criteria

- [ ] The `readAttributeForSerialization` body is the `send` dispatch, with no attribute-store probing.
- [ ] `serialization.test.ts` / `serialization.trails.test.ts` stay green on all lanes; a trails test covers a store value that shadows a method.
