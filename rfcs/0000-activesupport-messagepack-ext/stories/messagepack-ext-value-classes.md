---
title: "MessagePack ext types 11,13-16 Range/URI/IPAddr/Pathname/Regexp (need value classes + Ruby-faithful to_s)"
status: draft
updated: 2026-06-15
rfc: "0000-activesupport-messagepack-ext"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails registers ext types **11 Range, 13 URI::Generic, 14 IPAddr, 15 Pathname,
16 Regexp** in `ActiveSupport::MessagePack::Extensions`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:74-97`):

```ruby
registry.register_type 11, Range, ...      # :74 — [begin, end, exclude_end] (unpack :214)
registry.register_type 13, URI::Generic, packer: :to_s, unpacker: ->(s){ URI(s) }   # :84
registry.register_type 14, IPAddr, ...     # :88  (unpack :234)
registry.register_type 15, Pathname, packer: :to_s, unpacker: ->(s){ Pathname(s) }  # :93
registry.register_type 16, Regexp, ...     # :97
```

trails' registry (`packages/activesupport/src/message-pack/extensions.ts:89-152`)
registers none of `11/13/14/15/16`. Each needs a JS representation with a
Ruby-faithful `to_s` (most pack via `to_s`):

- **Range (11):** trails has a `Range` notion used in AR predicate/BETWEEN
  handling — confirm the canonical class and pack `[begin, end, excludeEnd]`
  (`extensions.rb:74`, unpack `:214`).
- **URI (13):** map to a JS `URL`/URI rep; pack `to_s`, unpack reconstruct.
- **IPAddr (14):** **no value class in trails** (only a test reference) — port a
  minimal IPAddr-equivalent (v4/v6 parse + `to_s`) then register (`:88`, unpack
  `:234`).
- **Pathname (15):** **no value class** — port a minimal Pathname (string
  wrapper with Ruby `to_s`) then register (`:93`).
- **Regexp (16):** map to native JS `RegExp`; encode source + flags with
  Ruby-faithful option translation (`:97`).

So this is value-class porting (IPAddr, Pathname, possibly a Range/URI wrapper)
plus codec registration. Likely larger than one ≤500 LOC PR — land the ones
whose value class already exists (Range/Regexp/URI) first and split IPAddr +
Pathname (which need new classes) into a follow-up story rather than fanning
out PRs.

## Acceptance criteria

- [ ] Register ext types **11, 13, 14, 15, 16** in `message-pack/extensions.ts`,
      mirroring `extensions.rb:74-97` pack/unpack (and the `:214`/`:234` read
      helpers), each over a Ruby-faithful value rep / `to_s`.
- [ ] Missing value classes (IPAddr, Pathname, any Range/URI wrapper not already
      present) are ported minimally — construction + `to_s` + the fields the
      codec needs — and reused, not inlined into the codec.
- [ ] Round-trip tests per type (incl. an exclusive Range, an IPv6 IPAddr, a
      Regexp with flags); cross-runtime byte-compatible with Ruby.
- [ ] Scoped to ≤500 LOC; split IPAddr/Pathname into a follow-up story if the
      budget is exceeded (register via `pnpm tasks new`, do not open sibling
      PRs).
- [ ] api:compare / test:compare delta non-negative.
