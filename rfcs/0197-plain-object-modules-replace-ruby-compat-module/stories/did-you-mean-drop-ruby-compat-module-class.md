---
title: "did-you-mean: modules are plain objects, not ruby-compat Module instances"
status: claimed
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["did-you-mean"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-19T20:37:52Z"
assignee: "activemodel-drop-ruby-compat-module-class"
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/did-you-mean/src` (non-test) constructing or testing a `Module`:

- `packages/did-you-mean/src/core-ext/name-error.ts:44`

1 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/did-you-mean/src/core-ext/name-error.ts:21`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/did-you-mean/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
