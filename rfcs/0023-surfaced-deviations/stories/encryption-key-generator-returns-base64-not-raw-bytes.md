---
title: "generate_random_key returns base64, blocking hex/secret from routing through it"
status: draft
updated: 2026-07-30
rfc: "0023-surfaced-deviations"
cluster: null
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

`ActiveRecord::Encryption::KeyGenerator#generate_random_key` returns raw bytes;
trails' `generateRandomKey` returns base64
(`packages/activerecord/src/encryption/key-generator.ts:28`). Rails:

```ruby
def generate_random_key(length: key_length)
  SecureRandom.random_bytes(length)
end

def generate_random_hex_key(length: key_length)
  generate_random_key(length: length).unpack("H*")[0]
end
```

Because the return type differs, `generateRandomHexKey` and
`generateRandomSecret` cannot route through `generateRandomKey` — they
re-derive their own randomness instead, which is why `generate_random_key`
shows up as an unrouted private in the PR #5629 sweep with no call site at all.
Its wide-baseline entry now carries a `reason` pointing here.

Routing is the easy half; the deviation has to be settled first, and settling
it means deciding what the TS analogue of Ruby's raw-byte String is
(`Uint8Array` is the obvious answer) and updating every consumer.

Discovered while working `activerecord-unrouted-privates-remaining-inventory`
(PR #5629).

## Acceptance criteria

- `generateRandomKey` returns the raw-bytes analogue rather than base64.
- `generateRandomHexKey` and `generateRandomSecret` route through it, matching
  Rails' `unpack("H*")` derivation.
- Every existing consumer of the base64 return value is updated; no silent
  double-encoding.
- A test asserts the hex key is the hex encoding of the same bytes the raw call
  produces (seed or stub the randomness so the two are comparable), and it
  fails on the pre-fix implementation.
- The `generate_random_key` wide-baseline entries in
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/encryption/`
  are removed once they converge.
