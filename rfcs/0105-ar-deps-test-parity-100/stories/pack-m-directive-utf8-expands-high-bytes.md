---
title: "pack's m directive UTF-8-expands bytes 0x80..0xff instead of encoding them"
status: draft
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pack` (`packages/ruby-compat/src/array.ts:65`, the port of `pack_pack`,
`vendor/ruby/pack.c:197`) runs its argument through `TextEncoder`
(`array.ts:102`) before Base64-encoding it. MRI reads `RSTRING_PTR` and
re-encodes nothing (`pack.c:663-690`), so the two disagree for any byte from
`0x80` up: trails UTF-8-expands it first.

Measured against the built package and MRI:

```text
bytes on disk           00 7f 80 c3 ff
IO.binread code units   0 7f 80 c3 ff          (correct — ASCII-8BIT)
pack([bin], "m0")       AH/CgMODw78=           (trails, wrong)
Base64.strict_encode64  AH+Aw/8=               (MRI)
```

MRI, for the two encodings a caller can hold:

```text
[[0x80,0xff].pack("C*")].pack("m0")   # ASCII-8BIT -> "gP8="
[255.chr("UTF-8")].pack("m0")         # UTF-8      -> "w78="
```

Both are "Base64 of the String's bytes"; they differ because the byte content
differs, not because `pack` inspects the encoding. JS has no encoding tag on a
string, which is why `pack` cannot infer it — and why picking `TextEncoder`
unconditionally is wrong for one of its two callers.

The two call sites want opposite things:

- `packages/rack-test/src/test.ts:194` (`Session#basic_authorize`,
  `vendor/rack-test/lib/rack/test.rb:199`) packs
  `"#{username}:#{password}"`, a UTF-8 String in Ruby, whose bytes ARE the UTF-8
  bytes. `TextEncoder` is correct there, and is why this defect has never
  surfaced: an ASCII credential encodes identically either way.
- `packages/activerecord/src/fixture-set/render-context.ts` needs the raw bytes
  of a `File.binread`. #7655 routes it around `pack` through a new
  `Base64.strictEncode64` (`packages/ruby-compat/src/base64.ts`) that consumes
  ruby-compat's one-code-unit-per-byte ASCII-8BIT representation directly.

So `Base64.strict_encode64` is `[bin].pack("m0")` in MRI
(`vendor/ruby/lib/base64.rb:273-275`) but cannot be in trails until `pack`
takes bytes. That divergence is the debt this story pays off.

## Acceptance criteria

- `pack`'s `m` directive encodes the argument's BYTES under ruby-compat's
  ASCII-8BIT convention (one code unit per byte, the `binaryBytes` helper at
  `io.ts:91`), not `TextEncoder`'s UTF-8 expansion.
- `rack-test`'s `basic_authorize` call site is migrated to hand `pack` the byte
  string its Ruby counterpart's UTF-8 String holds, so its behaviour is
  unchanged for ASCII and correct for non-ASCII credentials. Add a non-ASCII
  credential test pinning it against MRI.
- `Base64.strictEncode64` then delegates to `pack(["…"], "m0")`, as
  `base64.rb:274` does, and its `@noRailsEquivalent` prose about not routing
  through `pack` is deleted.
- A `pack` test covers bytes `0x00`, `0x7f`, `0x80`, `0xff` and asserts the MRI
  values above.

## Filing note

This is a ruby-compat defect, but every ruby-compat RFC is closed
(`0129-ruby-compat`, `0135-platform-adapters-in-ruby-compat` superseded;
`0138-ruby-compat-residual-convergence` closed), `0082-ruby-ts-idiom-conversion-classes`
— which CLAUDE.md names for exactly this class of silent Ruby→TS value
divergence — is postponed, there is no `ruby-compat-surfaced-deviations`
bucket, and CLAUDE.md forbids `0023`. Filed under `0105` because that is the
RFC whose work surfaced it, in #7655. Rehome it if a better bucket opens.
