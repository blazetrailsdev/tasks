---
title: "msgpack parity: ext type 17, HashWithIndifferentAccess"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of Phase 3, the ext-registry sweep over the 19 type ids
`packages/activesupport/src/message-pack/extensions.ts:96-196` registers. Each
ext story extends the value-spec union with its classes, adds a Ruby builder
arm in `oracle.rb`, generates against the gem with
`ActiveSupport::MessagePack`'s factory installed, and commits corpus cases.

Type 17 is `recursive: true` through `writeHashWithIndifferentAccess`. HWIA
stringifies its keys, so the interesting cases are a Symbol key and a String
key that collide, a nested HWIA, and a key order that a plain JS object would
reorder — the same numeric-key hazard
`msgpack-parity-array-map-and-nesting-boundaries` pins for plain maps.

## Acceptance criteria

- [ ] A HWIA and a plain Hash of the same pairs assert different bytes.
- [ ] Symbol and String keys that collide after stringification.
- [ ] Numeric-string keys in an order a JS object would reorder.
- [ ] Nested HWIA, and a HWIA containing other ext types as values.
- [ ] An empty HWIA, and one with a default or default proc if reachable.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
