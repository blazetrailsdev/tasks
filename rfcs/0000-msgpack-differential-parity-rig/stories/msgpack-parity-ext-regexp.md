---
title: "msgpack parity: ext type 16, Regexp and the MRI option letters"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
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

Type 16 is the registration that already documents a deviation. Rails passes
`:to_s` and `:new`; trails passes functions, because a JS `RegExp`'s
`toString` and constructor are JS's and ruby-compat's `Regexp#to_s` writes JS
option letters. So the packer asks for the MRI spelling by name —
`rbRegToS(regexp, "onig")` — read back by `rbRegInitStr`
(`extensions.ts:88-96, 189-192`).

The payload is MRI's `Regexp#to_s` with MRI's option letters
(`option_to_str`, `vendor/ruby/v3.3.11/re.c:322`). That makes this the ext type
most likely to diverge on a flag combination nobody enumerated.

## Acceptance criteria

- [ ] Every MRI option letter and combination reachable from a JS `RegExp`
      covered, asserting the `(?mix:...)` prefix matches the gem exactly.
- [ ] Flags with no MRI counterpart, and MRI flags with no JS counterpart, each
      recorded as a documented boundary with a citation if unreachable.
- [ ] Patterns covered: empty, anchors, a character class with a `]`, nested
      groups, a named group, an escaped delimiter, and a non-ASCII pattern.
- [ ] The round-trip through `rbRegInitStr` asserted to rebuild an equal
      Regexp, not merely equal bytes.
- [ ] The value-spec union and the Ruby builder both gain arms for every class
      above, and the generator covers each.
- [ ] Corpus cases committed per type id, including the degenerate values.
- [ ] Each divergence found is filed as its own story with the byte diff
      attached, per the RFC's Open Question 1.
