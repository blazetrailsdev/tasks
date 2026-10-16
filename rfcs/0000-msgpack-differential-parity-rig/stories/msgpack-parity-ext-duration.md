---
title: "msgpack parity: ext type 10, Duration"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
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

Type 10 is `recursive: true` through `Extensions.writeDuration`. RFC 0184
already filed `messagepack-duration-integral-float-value-dumps-as-integer` for
this type: a Duration whose value is an integral float must not pack as an
integer. That is the Phase 2 boxing rule surfacing inside an ext type, which
makes Duration the registry's best-understood hazard and a good early target.

## Acceptance criteria

- [ ] Durations built from each part — seconds, minutes, hours, days, weeks,
      months, years — and from combinations.
- [ ] A Duration whose value is an integral float asserted against the gem,
      pinning the behaviour `messagepack-duration-integral-float-value-dumps-as-integer`
      describes.
- [ ] Zero and negative durations.
- [ ] A Duration whose parts do not normalise to its value.
- [ ] The recursive arm asserted to pack the value through the Phase 2 float
      rules.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
