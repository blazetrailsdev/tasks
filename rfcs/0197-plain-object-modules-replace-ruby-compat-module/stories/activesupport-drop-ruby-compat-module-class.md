---
title: "activesupport: modules are plain objects, not ruby-compat Module instances"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["activesupport"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/activesupport/src` (non-test) constructing or testing a `Module`:

- `packages/activesupport/src/class-attribute.ts:25`
- `packages/activesupport/src/code-generator.ts:23`
- `packages/activesupport/src/code-generator.ts:60`
- `packages/activesupport/src/code-generator.ts:123`
- `packages/activesupport/src/current-attributes.ts:229`
- `packages/activesupport/src/delegation.ts:78`
- `packages/activesupport/src/delegation.ts:127`
- `packages/activesupport/src/descendants-tracker.ts:120`
- `packages/activesupport/src/cache/serializer-with-fallback.ts:56`
- `packages/activesupport/src/cache/serializer-with-fallback.ts:102`
- `packages/activesupport/src/cache/serializer-with-fallback.ts:121`
- `packages/activesupport/src/cache/serializer-with-fallback.ts:155`
- `packages/activesupport/src/cache/serializer-with-fallback.ts:170`
- `packages/activesupport/src/core-ext/module/concerning.ts:22`
- `packages/activesupport/src/core-ext/tse/util.ts:182`
- `packages/activesupport/src/module-ext.ts:85`
- `packages/activesupport/src/module-ext.ts:122`
- `packages/activesupport/src/rescuable.ts:58`
- `packages/activesupport/src/rescuable.ts:160`
- `packages/activesupport/src/message-pack/extensions.ts:432`
- `packages/activesupport/src/message-pack/extensions.ts:436`
- `packages/activesupport/src/message-pack/serializer.ts:26`
- `packages/activesupport/src/log-subscriber/test-helper.ts:133`
- `packages/activesupport/src/message-pack/cache-serializer.ts:6`
- `packages/activesupport/src/testing/constant-lookup.ts:22`
- `packages/activesupport/src/callbacks.ts:1193`

Test files:

- `packages/activesupport/src/code-generator.trails.test.ts`
- `packages/activesupport/src/deprecation.test.ts`
- `packages/activesupport/src/rescuable.test.ts`
- `packages/activesupport/src/callbacks.trails.test.ts`
- `packages/activesupport/src/delegation.trails.test.ts`
- `packages/activesupport/src/concern.test.ts`
- `packages/activesupport/src/core-ext/class/attribute.test.ts`
- `packages/activesupport/src/core-ext/module/attribute-accessor.test.ts`
- `packages/activesupport/src/core-ext/module/attribute-accessor.trails.test.ts`
- `packages/activesupport/src/testing/constant-lookup.test.ts`
- `packages/activesupport/src/testing/after-teardown-assertion.test.ts`
- `packages/activesupport/src/testing/after-teardown.test.ts`
- `packages/activesupport/src/testing/setup-and-teardown.trails.test.ts`

1 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/activesupport/src/message-pack/cache-serializer.ts:9`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/activesupport/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
