---
title: "msgpack parity: ext types 11 and 12, Range and Set"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 240
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

Both are `recursive: true`. A Range packs its begin, end and exclusivity, so
beginless and endless ranges are the interesting cases; a Set packs its members,
which makes member order the question — a Ruby Set preserves insertion order
and a JS `Set` does too, so this should hold, which is worth pinning.

## Acceptance criteria

- [ ] Ranges: inclusive and exclusive, beginless, endless, empty, integer,
      float, string, and Date endpoints.
- [ ] A range whose endpoints are themselves ext types.
- [ ] Sets: empty, single member, duplicate members collapsing, insertion order
      preserved, and members of mixed types including ext types.
- [ ] A Set and an Array of the same members assert different bytes.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
