---
title: "activerecord: move the 94 TS-only tests in Rails-named encryption test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 436
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` counts **1007 extra (TS only)** activerecord tests — tests in a Rails-mirroring
convention file that no Rails test consumed. The convention is that a TS-only test lives in the
`.trails.test.ts` sibling, so a Rails-named file holds only Rails' tests and its drift is visible.
This story's files (extras per file):

- `packages/activerecord/src/encryption/encryptable-record.test.ts` — 25
- `packages/activerecord/src/encryption/extended-deterministic-queries.test.ts` — 20
- `packages/activerecord/src/encryption/scheme.test.ts` — 14
- `packages/activerecord/src/encryption/encryptor.test.ts` — 9
- `packages/activerecord/src/encryption/key-generator.test.ts` — 5
- `packages/activerecord/src/encryption/cipher/aes256-gcm.test.ts` — 5
- `packages/activerecord/src/encryption/message-pack-message-serializer.test.ts` — 4
- `packages/activerecord/src/encryption/configurable.test.ts` — 3
- `packages/activerecord/src/encryption/encryption-schemes.test.ts` — 2
- `packages/activerecord/src/encryption/message-serializer.test.ts` — 2
- `packages/activerecord/src/encryption/read-only-null-encryptor.test.ts` — 2
- `packages/activerecord/src/encryption/null-encryptor.test.ts` — 1
- `packages/activerecord/src/encryption/encrypting-only-encryptor.test.ts` — 1
- `packages/activerecord/src/encryption/deterministic-key-provider.test.ts` — 1

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
