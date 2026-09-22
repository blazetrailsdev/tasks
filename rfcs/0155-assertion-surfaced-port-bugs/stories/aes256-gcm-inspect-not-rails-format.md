---
title: "aes256-gcm-inspect-not-rails-format"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Parked by assertions-tail-root-4 in `packages/activerecord/src/encryption/cipher/aes256-gcm.test.ts` ("inspect_does not show secrets", `it.skip`).

Rails `activerecord/test/cases/encryption/cipher/aes256_gcm_test.rb` asserts `cipher.inspect` matches `/\A#<ActiveRecord::Encryption::Cipher::Aes256Gcm:0x[0-9a-f]+>\z/`. trails' `[Symbol.for("nodejs.util.inspect.custom")]` in `encryption/cipher/aes256-gcm.ts:37` returns `"Cipher {}"`. The old test's secret-not-leaked checks were dropped when converging; keep them in a `.trails.test.ts` twin if wanted.

## Acceptance criteria

- `inspect(cipher)` matches the Rails pattern and still hides the secret.
- Un-skip the test.
