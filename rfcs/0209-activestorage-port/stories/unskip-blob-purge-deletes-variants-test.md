---
title: "unskip-blob-purge-deletes-variants-test"
status: claimed
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-03T22:48:22Z"
assignee: "generated-app-vitest-suite-runs-against-packed-packages"
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/src/blob.test.ts:427` parks "purge deletes variants from
external service with the purge_later" as `it.skip` under
`BLOCKED: activestorage-variation-and-variants`, which is now done, and variants
process in tests (trails#9677). Rails:
`vendor/rails/v8.0.2/activestorage/test/models/blob_test.rb` (the same-named test).
The body still reaches `variant` through an ad-hoc cast.

## Acceptance criteria

- The test is un-skipped, typed through `Blob#variant` with no structural cast, and
  passes.
