---
title: "msgpack parity: ext types 13, 14 and 15, URI::Generic, IPAddr and Pathname"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
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

Type 13 packs a `URI::Generic` through `toString` and reads it back through
`URI.parse`; type 15 packs a `Pathname` through `toString` and `new`. Both are
round-trip-through-string, so the risk is in the string each port produces.
Type 14 is `recursive: true` through `writeIpaddr` / `readIpaddr`, where the
prefix length and address family are the divergence candidates.

## Acceptance criteria

- [ ] URIs: every component present, missing components, a port that is the
      scheme default, userinfo, an empty path, a query with no value, a
      fragment, and a non-ASCII path.
- [ ] A URI subclass instance covered if the registry reaches one, else the
      limit recorded.
- [ ] IPAddr: IPv4 and IPv6, with and without a prefix, the all-zeros and
      all-ones addresses, an IPv4-mapped IPv6 address, and a prefix of 0 and of
      the full width.
- [ ] Pathname: empty, relative, absolute, trailing slash, `.` and `..`
      segments, and a non-ASCII path.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
