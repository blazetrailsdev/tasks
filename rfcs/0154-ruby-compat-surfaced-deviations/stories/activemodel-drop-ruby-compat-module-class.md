---
title: "activemodel: modules are plain objects, not ruby-compat Module instances"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["activemodel"]
deps: ["remove-ruby-compat-module-class"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/activemodel/src` (non-test) constructing or testing a `Module`:

- `packages/activemodel/src/api.ts:30`
- `packages/activemodel/src/attributes.ts:71`
- `packages/activemodel/src/dirty.ts:207`
- `packages/activemodel/src/validations.ts:403`
- `packages/activemodel/src/attribute-methods.ts:360`
- `packages/activemodel/src/conversion.ts:19`
- `packages/activemodel/src/validations/callbacks.ts:99`
- `packages/activemodel/src/type/serialize-cast-value.ts:17`
- `packages/activemodel/src/type/serialize-cast-value.ts:48`

Test files:

- `packages/activemodel/src/attributes.test.ts`
- `packages/activemodel/src/error.test.ts`
- `packages/activemodel/src/errors.test.ts`
- `packages/activemodel/src/naming.test.ts`
- `packages/activemodel/src/type/serialize-cast-value.test.ts`

11 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/activemodel/src/attributes.ts:33`
- `packages/activemodel/src/attributes.ts:38`
- `packages/activemodel/src/attributes.ts:68`
- `packages/activemodel/src/dirty.ts:163`
- `packages/activemodel/src/dirty.ts:171`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/activemodel/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
