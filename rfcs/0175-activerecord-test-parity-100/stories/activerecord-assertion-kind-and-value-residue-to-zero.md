---
title: "activerecord: the 3 assertion-kind and 1 assertion-value mismatches, and the mark to 0"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: skipped-tests
packages: ["activerecord"]
deps: ["psych-load-and-safe-load", "string-encoding-tag-carrier-for-force-encoding-and-b"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test:assertions` passes, but `scripts/test-compare/assertion-mismatch-mark.json` holds
activerecord at **kind 4, value 1** (the run measures kind 3 — one point of slack the ratchet has no
staleness arm to catch):

- kind: `fixtures_test.rb` "reloading fixtures through accessor methods"; `yaml_serialization_test.rb`
  "new records remain new after round trip", "deserializing rails v2 yaml" (both Psych).
- value: `encryption/encryptable_record_test.rb` "forced encoding for deterministic attributes will replace
  invalid characters" (`encryptor-test-encoding-assertion` / `string-encoding-tag-carrier-for-force-encoding-and-b`).

`flip-assertion-mismatch-gate-to-hard-zero` (RFC 0123, blocked) is the gate change; this story empties
activerecord's row.

## Acceptance criteria

- [ ] Each case asserts with Rails' assertion kind and value.
- [ ] The activerecord row in `assertion-mismatch-mark.json` reads `assertionCount 0, kind 0, value 0`.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
