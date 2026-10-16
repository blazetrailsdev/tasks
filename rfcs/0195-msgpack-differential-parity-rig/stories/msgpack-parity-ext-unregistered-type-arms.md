---
title: "msgpack parity: ext type 127, the unregistered-type error and fallback arms"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 200
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

Type 127 is registered twice, by two different installers:
`installUnregisteredTypeError` and `installUnregisteredTypeFallback`
(`extensions.ts:200-212`). They are the two policies for a value with no
registered type, so this story pins both — the raising arm's error class and
message, and the fallback arm's payload.

## Acceptance criteria

- [ ] With the error installer, an unregistered class raises the same error
      class and message the gem raises.
- [ ] With the fallback installer, an unregistered class packs to bytes
      matching the gem.
- [ ] An unregistered class nested inside a registered recursive type covered
      under both installers.
- [ ] Unpacking an ext payload whose type id is registered by neither arm.
- [ ] Unpacking an ext payload with a type id outside the registered range,
      including a negative id.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
