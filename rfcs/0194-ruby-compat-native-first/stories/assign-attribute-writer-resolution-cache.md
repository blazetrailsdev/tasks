---
title: "_assignAttribute resolves its writer from a per-prototype cache (under 100 ns dispatch overhead)"
status: ready
updated: 2026-10-24
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: [activemodel, ruby-compat]
deps:
  - native-respond-to-and-send-literal-name-sites
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::AttributeAssignment#_assign_attribute` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:67-76`) is `public_send(setter, v)`. trails#9288 resolves that writer natively in `packages/activemodel/src/attribute-assignment.ts` (`_assignAttribute`) with a prototype walk that keeps `sendInternal`'s per-level precedence (`packages/ruby-compat/src/object.ts`): own `k=`, then an accessor set half, then a `setK` writer.

The plain-node dist bench in trails#9288 measured about 180 ns of overhead over calling the generated `name=` method directly, down from about 690 ns with `rbFSend`. The walk alone (nine `Object.hasOwn` calls over three levels) costs about 134 ns, so the "under 100 ns" target in `native-respond-to-and-send-literal-name-sites` needs a per-prototype resolution cache. That is the `WeakMap` per prototype that RFC 0194 § "Dispatch cost" already sketches for `respondToMissing`.

## Acceptance criteria

- [ ] `_assignAttribute` resolves the writer from a per-prototype cache (instance-own `k` / `k=` still checked first) and keeps `sendInternal`'s precedence.
- [ ] The cache is invalidated (or keyed) so that attribute methods defined after the first assignment (`defineAttributeMethods`, `undefineAttributeMethods`, a later `attribute` call) are seen. A test covers each.
- [ ] A plain-node dist bench shows under 100 ns of dispatch overhead per assigned attribute, with the numbers in the PR body.
