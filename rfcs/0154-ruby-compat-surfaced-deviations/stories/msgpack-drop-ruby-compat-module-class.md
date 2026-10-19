---
title: "msgpack: modules are plain objects, not ruby-compat Module instances"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["msgpack"]
deps: ["remove-ruby-compat-module-class"]
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

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/msgpack/src` (non-test) constructing or testing a `Module`:

- `packages/msgpack/src/unpacker.ts:29`
- `packages/msgpack/src/factory.ts:259`
- `packages/msgpack/src/packer.ts:74`

Test files:

- `packages/msgpack/src/packer.trails.test.ts`
- `packages/msgpack/src/packer.test.ts`
- `packages/msgpack/src/factory.trails.test.ts`

## Acceptance criteria

- Every `new Module(...)` in `packages/msgpack/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
