---
title: "rbfsend-per-prototype-writer-cache"
status: done
updated: 2026-10-27
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9371
claim: "2026-10-27T13:48:17Z"
assignee: "rbfsend-per-prototype-writer-cache"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::AttributeAssignment#_assign_attribute` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:67-76`) is `public_send(setter, v)`. trails#9295 made `_assignAttribute` (`packages/activemodel/src/attribute-assignment.ts`) resolve the writer itself. It reads a per-prototype `WeakMap` keyed on ruby-compat's `methodCacheSerial` (`packages/ruby-compat/src/include.ts`, MRI `rb_clear_method_cache`, `vendor/ruby/v3.3.11/vm_method.c:295`), and that brought dispatch overhead under 100 ns. The cost is `if` arms that Rails' body does not have (`typeof write`, `if (write)`, the own-member ternary). They are receipted `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- [ ] `rbFSend` / `sendInternal` (`packages/ruby-compat/src/object.ts`) resolves a writer through the same per-prototype cache, invalidated by `methodCacheSerial`.
- [ ] `_assignAttribute` is back to Rails' shape: `rbFSend(this, setter, v)` inside the `NoMethodError` rescue, with no resolution arms. Its `@inventedArm if` receipt is deleted.
- [ ] A plain-node dist bench still shows under 100 ns of dispatch overhead per assigned attribute.
