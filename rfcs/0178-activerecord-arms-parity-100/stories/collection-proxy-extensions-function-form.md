---
title: "CollectionProxy applies extensions one at a time, with a function arm Rails lacks"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy`'s constructor (`packages/activerecord/src/associations/collection-proxy.ts`) walks `association.extensions` in reverse and, per element, either calls it (`typeof mod === "function"`) or `extend`s it. Rails is one call: `extend(*extensions) if extensions.any?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_proxy.rb:32-38`).

Two things stand between the port and that line:

- ruby-compat's `extend(klass, mod)` takes one module. MRI's `rb_obj_extend` (`vendor/ruby/v3.3.11/eval.c:1778`) takes `argc` modules and applies them last to first, which is the reversed loop the constructor open-codes.
- An extension may be a plain function `(rel) => void`, trails' stand-in for the block Rails turns into a `Module` (`Module.new(&block)`, `associations/builder/collection_association.rb:23-28`). `QueryMethods#extending!` (`relation/query-methods.ts`) has the same function arm. A class-shaped module is also `typeof "function"`, so the two cannot be told apart by `extend` itself.

Receipted `@inventedArm loop` / `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- [ ] `extend` in ruby-compat is variadic and applies modules in `rb_obj_extend`'s order.
- [ ] A block-form extension is built into a module at the builder (`wrap_scope` / `define_extensions`), so the proxy and `extendingBang` receive modules only and the function arm is deleted from both.
- [ ] `CollectionProxy`'s constructor is `if (extensions.length > 0) extend(this, ...extensions)`, the receipts are deleted, and the arms row stays clear.
