---
rfc: "0195-msgpack-differential-parity-rig"
title: "A differential parity rig for @blazetrails/msgpack, fuzzed against the msgpack gem"
status: draft
created: 2026-10-16
updated: 2026-10-16
owner: "@deanmarano"
packages:
  - msgpack
  - activesupport
  - activerecord
clusters:
  - rig
  - native
  - ext
  - serializer
related-rfcs:
  - "0184-msgpack-gem-port"
  - "0041-activesupport-messagepack-ext"
priority: 5
---

# RFC 0195 — A differential parity rig for msgpack

## Summary

`@blazetrails/msgpack` and `ActiveSupport::MessagePack` produce bytes that a
Ruby process reads. Today nothing checks those bytes against the gem's: the
package is verified by ported specs, which assert what their authors thought
to write down. This RFC builds a **generative differential rig** under
`packages/msgpack/parity/` that constructs the same value on both sides, packs
it with the gem and with trails, and compares the bytes.

The rig is a developer tool. What CI runs is a **committed corpus** of shrunk
cases with the gem-produced bytes baked in as the expectation, so the CI test
needs no Ruby, no gem and no randomness.

## Motivation

**1. The ext registry is 19 Rails-assigned type ids, each independently
wrong-able.** `packages/activesupport/src/message-pack/extensions.ts:96-196`
registers:

```text
 0 Symbol       6 Date            12 Set
 1 Integer      7 Time            13 URI::Generic
 2 BigDecimal   8 TimeWithZone    14 IPAddr
 3 Rational     9 TimeZone        15 Pathname
 4 Complex     10 Duration        16 Regexp
 5 DateTime    11 Range           17 HashWithIndifferentAccess
                                 127 unregistered (error / fallback arms)
```

Ten of those classes — `BigDecimal`, `Rational`, `Complex`, `TimeWithZone`,
`TimeZone`, `Duration`, `Range`, `IPAddr`, `Regexp`, `HashWithIndifferentAccess`
— are themselves trails ports with their own precision and formatting risk. A
round-trip fuzzer over the registry transitively exercises all ten, and every
finding arrives as a byte diff rather than a judgement call about intended
behaviour.

Several registrations already carry known sharp edges. Type 16 does not call
`Regexp#to_s`: it asks for the MRI spelling by name,
`rbRegToS(regexp, "onig")`, because a JS `RegExp`'s option letters are JS's
(`extensions.ts:88-96`). Type 10's integral-float case needed its own story in
the `0184-msgpack-gem-port` RFC
(`messagepack-duration-integral-float-value-dumps-as-integer`). Type 1 routes
oversized integers through `MessagePack::Bigint`. None of these is covered by
a generative test.

**2. Byte divergence here is a cross-process data bug, not a local one.**
msgpack is the default serializer on the Rails 7.1+ path, and three distinct
consumers read what the packer writes:

- `packages/activesupport/src/cache/serializer-with-fallback.ts` — `Rails.cache`
- `packages/activesupport/src/messages/metadata.ts` — signed and encrypted cookies
- `packages/activerecord/src/encryption/message-pack-message-serializer.ts` —
  encrypted columns

A trails app sharing a Redis or Memcached instance with a Ruby app, or reading
a cookie a Ruby app signed, depends on these bytes agreeing. The bad case is
not a decode failure; it is a decode to a _different value_.

**3. The gem ships no generative prior art, and its corpus is a token.**
`vendor/msgpack/v1.8.0/spec/cases.json` is **220 bytes** and `cases.msg` is
**213 bytes** — `cases_spec.rb` zips them and compares, and that is the whole
conformance corpus. `spec/random_compat.rb` is not a fuzzer; it is a `Random`
polyfill shim for pre-1.9 Ruby. The gem's specs are already ported under RFC
0184 (`msgpack-pack-spec-port`, `msgpack-factory-spec-remaining-tests`,
`msgpack-packer-unpacker-remaining-specs-and-buffer-to-str`, and others), so
there is no further spec surface to harvest. Generation is the only way to
grow coverage here.

**4. Parity is achievable for this format, unlike Marshal.** `Marshal.dump`
cannot be byte-compared against Ruby's: `packages/ruby-compat/src/marshal.ts:1442`
documents six `PERMANENT` divergences, three of which — the identity table
answering `TYPE_LINK` for equal strings, the UTF-8-for-every-string encoding
tag, and whole-valued numbers being Integers — live in the most common value
types, so a differential dump fuzzer there would be mostly noise. msgpack has
**no identity or link table at all** (grep `identity|link|WeakMap|seen|dedup|cycle`
over `packages/msgpack/src/packer.ts` returns nothing) and no encoding ivars,
and its ext ids explicitly box the ambiguous types rather than inferring them
from a value's runtime shape. The one shared residue is the whole-number
question at `packer.ts:110,126,214,415`, which is a single known convention
the generator encodes once.

## Design

Everything lives under `packages/msgpack/parity/`, self-contained, with no
pluggable-site abstraction.

```text
packages/msgpack/parity/
  value-spec.ts     # the shared value-spec types
  build.ts          # value-spec -> TS value
  oracle.rb         # value-spec -> gem bytes + canonical inspect (NDJSON)
  generate.ts       # seeded generator of value-specs
  shrink.ts         # structural minimisation of a failing spec
  run.ts            # driver: generate, compare, shrink, report
  corpus/*.json     # committed shrunk cases, gem bytes baked in
```

### The value-spec language is the load-bearing piece

The two sides cannot exchange values, only a recipe for building one. A
**value-spec** is a small JSON tree naming a type and its construction
arguments:

```json
{
  "t": "array",
  "v": [
    { "t": "int", "v": "-9223372036854775808" },
    { "t": "float", "v": "-0.0" },
    { "t": "bigdecimal", "v": "1.5e-20" },
    { "t": "range", "begin": { "t": "int", "v": "1" }, "end": { "t": "nil" }, "excl": true },
    { "t": "str", "enc": "ASCII-8BIT", "bytes": "FF00" }
  ]
}
```

Two rules make it sound:

- **Every scalar is carried as a string or hex, never as a JSON number.** JSON
  numbers would lose exactly the distinctions under test — `-0.0`, integers
  past 2^53, float precision. A JSON-number transport would silently make the
  harness agree with itself.
- **The spec names the Ruby type, not the JS one.** `{"t":"float","v":"1.0"}`
  is a Ruby `Float`, which the TS builder must construct as a boxed `Number`
  (`rbDbl2num`) because an unboxed whole-valued JS number is an Integer
  (`packer.ts:126`). That convention is encoded once, in `build.ts`, rather
  than triaged on every finding.

### Both directions are checked

- **Dump:** build the value on each side, pack, compare bytes exactly.
- **Load:** feed the gem's bytes to the trails unpacker, re-pack, and require
  the bytes to round-trip identically; separately compare the unpacked value
  against the canonical description `oracle.rb` emits alongside the bytes.

### The corpus is what CI runs

A divergence is shrunk and committed to `parity/corpus/` as a case holding the
value-spec and the **gem-produced bytes as the expectation**.
`packages/msgpack/src/parity-corpus.trails.test.ts` reads the corpus, builds
each value through `build.ts`, packs it, and asserts the bytes. No Ruby, no
gem, no randomness in CI. The corpus only grows, matching the repo's ratchet
conventions.

The fuzzer runs out of band: `pnpm fuzz:msgpack --seed <n> --iterations <n>`.

## Non-goals

- **A general multi-site fuzz harness.** Decided msgpack-only and
  self-contained (2026-10-16). Marshal and `Date._parse` would need their own
  copies of the transport and shrinker; that is a deliberate duplication cost
  taken to keep this RFC small.
- **Marshal dump parity.** Not achievable; see Motivation 4 and the `@boundary`
  block at `packages/ruby-compat/src/marshal.ts:1442`.
- **A nightly CI fuzz job.** Rejected to keep Ruby and the gem out of CI and
  avoid nondeterministic reds. The committed corpus is the CI surface.
- **Converging the divergences this rig finds.** Each finding is filed as its
  own story against the package it is about. This RFC delivers the rig and the
  corpus mechanism, not the fixes.
- **Fuzzing the `@msgpack/msgpack` npm library itself.** trails wraps it; a bug
  below the wrapper is an upstream report, not a trails story.

## Alternatives considered

- **Port more gem specs instead.** There is nothing left to port: the gem's
  whole conformance corpus is 433 bytes across two files, and its specs are
  already ported under RFC 0184 (Motivation 3).
- **Compare against a hand-written expectation table.** This is what the ported
  specs already are. It cannot cover a 19-id registry crossed with the native
  type families, which is the space where the bugs are.
- **A JSON-number transport for the value-spec.** Rejected: it loses `-0.0`,
  integers past 2^53 and float precision — the exact distinctions under test.
- **Fuzzing Marshal instead.** Higher bug density, but its dump side has six
  ratified `PERMANENT` divergences sitting on strings, integers and floats, so
  the noise is in the common case. A Marshal **robustness** fuzzer (mutated
  bytes into `Marshal.load`, asserting it raises rather than hangs or
  over-allocates) is worth doing and is a separate RFC.

## Rollout

1. **Phase 1 — the rig.** `msgpack-parity-value-spec-and-builders`,
   `msgpack-parity-ruby-oracle-harness`, `msgpack-parity-driver-and-byte-diff-report`,
   `msgpack-parity-structural-shrinker`,
   `msgpack-parity-corpus-format-and-ci-test`.
2. **Phase 2 — native type families.**
   `msgpack-parity-integer-family-boundaries`,
   `msgpack-parity-float-and-integral-float-boxing`,
   `msgpack-parity-string-bin-and-encoding`,
   `msgpack-parity-array-map-and-nesting-boundaries`.
3. **Phase 3 — the ext registry.** `msgpack-parity-ext-symbol-and-bigint`,
   `msgpack-parity-ext-numeric-value-classes`,
   `msgpack-parity-ext-date-and-datetime`,
   `msgpack-parity-ext-time-timewithzone-and-timezone`,
   `msgpack-parity-ext-duration`, `msgpack-parity-ext-range-and-set`,
   `msgpack-parity-ext-uri-pathname-and-ipaddr`,
   `msgpack-parity-ext-regexp`,
   `msgpack-parity-ext-hash-with-indifferent-access`,
   `msgpack-parity-ext-unregistered-type-arms`.
4. **Phase 4 — the serializer layers.**
   `msgpack-parity-activesupport-serializer-and-signature`,
   `msgpack-parity-cache-serializer-entry-payload`,
   `msgpack-parity-serializer-with-fallback-latin1-round-trip`,
   `msgpack-parity-ar-encryption-message-serializer-payload`.

## Verification

- `packages/msgpack/parity/corpus/` holds at least one case for **each of the
  19 ext type ids** and **each of the 9 native type families** (nil, bool,
  int, float, str, bin, array, map, ext), and the CI corpus test passes with
  no Ruby installed.
- `pnpm fuzz:msgpack --seed 1 --iterations 1000000` completes with **zero
  unexplained divergences** — every divergence either converged, or filed as a
  story, or recorded as a documented boundary in `build.ts` with its citation.
- The gem version the oracle runs against is pinned to `1.8.0`, matching
  `vendor/sources.lock.json`, and the oracle fails loudly on a mismatch.

## Open questions

1. **Where do found divergences get filed?** Options: against this RFC as
   `converge-*` stories, or against the owning package's
   `<package>-surfaced-deviations` bucket. Recommendation: the surfaced-deviations
   bucket for the package the bug is in, since this RFC closes when the rig
   ships and the corpus mechanism works — it is infrastructure, not a burndown.
2. **Does the corpus test need the optional peer?**
   `@blazetrails/msgpack` is an optional peer of activesupport
   (`packages/activesupport/CLAUDE.md`, "`active_support/message_pack` is loaded
   by an awaited step at boot"). The native and ext corpora live in
   `packages/msgpack`, where it is a direct dependency, but the Phase 4
   serializer cases sit above it. Recommendation: keep every corpus file in
   `packages/msgpack` and have the Phase 4 stories import activesupport from
   the msgpack package's test, or skip when unseated.
3. **Should the float32 arm be fuzzed?** `writeFloat32`
   (`packer.ts:288-295`) is reachable only through an explicit call, not
   through `write`. Recommendation: cover it in the native float story but do
   not generate it, since no serializer path emits it.

## Changelog

- 2026-10-16: initial RFC
