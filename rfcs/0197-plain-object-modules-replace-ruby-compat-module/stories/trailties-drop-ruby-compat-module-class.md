---
title: "trailties: modules are plain objects, not ruby-compat Module instances"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["trailties"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
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

Sites in `packages/trailties/src` (non-test) constructing or testing a `Module`:

- `packages/trailties/src/thor/invocation.ts:172`
- `packages/trailties/src/thor/shell.ts:38`
- `packages/trailties/src/thor/shell.ts:155`
- `packages/trailties/src/test-help.ts:48`
- `packages/trailties/src/test-help.ts:57`
- `packages/trailties/src/thor/actions.ts:388`
- `packages/trailties/src/trailties/action-controller.ts:197`

Test files:

- `packages/trailties/src/boot-app-test-help.trails.test.ts`
- `packages/trailties/src/thor/util.test.ts`

2 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/trailties/src/thor/actions.ts:368`
- `packages/trailties/src/thor/shell.ts:150`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/trailties/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
