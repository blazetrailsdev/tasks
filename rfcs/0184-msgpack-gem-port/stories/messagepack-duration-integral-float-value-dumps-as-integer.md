---
title: "MessagePack Duration: an integral Float value/part dumps as a msgpack integer where Ruby writes float64"
status: in-progress
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8688
claim: "2026-10-08T17:33:33Z"
assignee: "messagepack-duration-integral-float-value-dumps-as-integer"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessagePack::Extensions.write_duration`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:195-198`)
writes `duration.value` with `packer.write`. In Ruby a Duration built from a
Float scalar keeps a Float value even when it is integral: `-(1.5.hours)` has
`value == -5400.0` and `_parts == { hours: -1.5 }`, and the msgpack gem writes
that value as a float64.

trails' `writeDuration` (`packages/activesupport/src/message-pack/extensions.ts`,
landed in trails#8630) writes `duration.value`, a JS number. A JS number has no
Integer/Float distinction, so the packer writes the integral value as a msgpack
integer.

Measured (real Rails 8.1.3 `ActiveSupport::MessagePack.dump(-(1.5.hours)).bytes`
against trails `MessagePack.dump(hours(1.5).negate())`):

```text
Ruby:   204 128 199 25 10 203 192 181 24 0 0 0 0 0 151 192 192 192 192 203 191 248 0 0 0 0 0 0 192 192
trails: 204 128 199 19 10 209 234 232          151 192 192 192 192 203 191 248 0 0 0 0 0 0 192 192
```

Each side loads the other's bytes to an equal Duration (`Duration#==` compares
value, `duration.rb:335-341`), but Ruby's reloaded `value` is then an Integer
where the original was a Float, and the bytes are not identical, so a cache key
or digest over the dump differs between runtimes. The same integral-Float gap
applies to any part written by `_parts.values_at(*PARTS)` (`2.0.hours`).

The parts that are non-integral (`1.5`) already match.

## Acceptance criteria

- [ ] Decide the carrier: whether `Duration` records that its value (and each
      part) came from a Float scalar, or whether the packer has a general
      Float-typed write the Duration packer can call. Check first whether the
      `msgpack` package (RFC 0184) already has a Float/Integer discriminator.
- [ ] `MessagePack.dump(hours(1.5).negate())` is byte-identical to the Ruby
      bytes above, pinned in `message-pack/serializer.trails.test.ts`.
- [ ] A Duration loaded from Ruby's float64 value dumps back to the same bytes.
- [ ] If no carrier is expressible without a Float type in ruby-compat,
      `pnpm tasks block` this with that specific blocker.
