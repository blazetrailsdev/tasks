---
title: "msgpack parity: ext types 5 and 6, DateTime and Date"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: ext
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 260
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

Types 5 and 6 are `recursive: true`, packing through
`Extensions.writeDatetime` / `writeDate`. `packages/date` is its own port with
its own calendar arithmetic, so this story exercises that port as much as the
packer.

## Acceptance criteria

- [ ] Dates covered: the Julian-Gregorian reform boundary, year 0, negative
      years, leap days, 29 February on a non-leap year rejected consistently,
      and the minimum and maximum representable dates.
- [ ] DateTimes covered: offsets across the full range including half-hour and
      three-quarter-hour zones, fractional seconds at nanosecond precision, and
      midnight versus end-of-day.
- [ ] A Date and a DateTime for the same instant assert different bytes.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
