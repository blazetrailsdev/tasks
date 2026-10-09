---
title: "ruby-compat: rbDefineModule creates or reopens a top-level module; sharded test models use it"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `module Sharded` creates the module or reopens it (`rb_define_module`, `vendor/ruby/v3.3.11/class.c`). Rails' eight sharded test models each open it and each load alone (`vendor/rails/v8.0.2/activerecord/test/models/sharded/blog.rb:8`, `blog_post_destroy_async.rb`).

ruby-compat has no create-or-reopen call, so trails#8711 wrote it out in each of the eight `packages/activerecord/src/test-helpers/models/sharded/*.ts` files:

```ts
const Sharded = (registeredConstant("Sharded") as Module | undefined) ?? new Module();
registerConstant("Sharded", Sharded);
```

The reviewer flagged the eight copies as invented glue. The same need exists wherever one Ruby namespace is opened by several files that have no shared parent file.

## Acceptance criteria

- [ ] ruby-compat exports `rbDefineModule(name)` mirroring `rb_define_module`: it answers the seated top-level module, raises `TypeError` when the constant is not a module, and otherwise creates and seats one. It carries its MRI citation and a `@noRailsEquivalent PERMANENT` receipt.
- [ ] The eight `sharded/*.ts` files read `const Sharded = rbDefineModule("Sharded");`.
- [ ] `pnpm parity:api:extra:gate` stays green for ruby-compat.
