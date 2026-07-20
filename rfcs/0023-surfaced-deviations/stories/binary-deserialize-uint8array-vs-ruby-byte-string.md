---
title: "BinaryType#deserialize yields Uint8Array where Ruby yields a byte String"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `encrypted-binary-column-text-ciphertext-roundtrip`
(PR #5012, RFC 0055).

Ruby has no distinct byte-array type: a binary column reads back as a
BINARY-encoding `String`, so Rails' `encryptable_record_test.rb:433-438`
asserts `assert_encrypted_attribute ..., :logo, "book"` — comparing a binary
column's read value directly against text — and Rails'
`ActiveModel::Type::Binary#deserialize` (`activemodel/lib/active_model/type/binary.rb`)
just returns that String.

trails' `BinaryType#deserialize` returns a `Uint8Array` instead. The wrapper
`BinaryData` (`packages/activemodel/src/type/binary.ts:66`) exists for the
serialize side only, and its `toString()` UTF-8 decodes — which corrupts bytes

> = 0x80 into U+FFFD — so it is not a drop-in String analogue either.

The consequence is that every Rails assertion comparing a binary attribute to
text is meaningless in trails without a bridge. PR #5012 had to add a Latin-1
decode arm plus an `_isBinaryAttribute` decorator-chain walk to
`packages/activerecord/src/encryption/test-helpers.ts` purely to make the four
Rails asserts express what Rails expresses. Encryption is where it surfaced,
but the deviation is in the type, so any binary column is affected.

This may well be a deliberate TS analogue (compare
[[project_js_date_rejected_temporal_is_time_analogue]] — JS `Date` rejected
AR-wide in favor of Temporal). Filing it so triage makes that call explicitly
rather than leaving it as an unrecorded divergence with per-test workarounds
accreting around it.

## Acceptance criteria

- Decide and record whether `Uint8Array` is the sanctioned Ruby-byte-String
  analogue for binary columns, or whether `BinaryType#deserialize` should yield
  a byte-safe string-like value.
- If sanctioned: document it as an accepted deviation (the `@internal` JSDoc
  convention on `BinaryType`) and note that Rails tests comparing binary
  attributes to text legitimately need a decode bridge, so future ports do not
  re-litigate it per test.
- If converging: `BinaryType#deserialize` returns a value that compares equal to
  text without a helper, bytes >= 0x80 survive intact (no U+FFFD), and the
  Latin-1 arm + `_isBinaryAttribute` walk in
  `packages/activerecord/src/encryption/test-helpers.ts` are deleted.
- Either way, `binary data can be encrypted` / `... uncompressed` and
  `encrypts normalized data` stay green on sqlite + PG + MySQL/MariaDB.
