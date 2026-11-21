---
title: "parity: unported-files test rows match test-compare's package key (actiondispatch)"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: measurement
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/actionpack.ts:5` registers
`dispatch/session/mem_cache_store_test.rb` under `package: "actionpack"`, but
test-compare keys that file as `actiondispatch`, and `isTestFileUnported`
(`scripts/parity/unported-files/index.ts:96-98`) compares the scope literally.
So 9 tests that are permanent by the 2026-10-17 Solid-stack-only ruling read as
missing. activesupport `cache_store_setting_test.rb`'s 4 mem-cache arms are
parked under a stale `BLOCKED:` line instead of a `tests:` row.

## Acceptance criteria

- [ ] `isTestFileUnported` / `isTestCaseUnported` resolve a row's package through the same mapping test-compare uses (actionpack ↔ actiondispatch / actioncontroller / abstractcontroller).
- [ ] `mem_cache_store_test.rb`'s 9 tests leave `parity:test --missing`.
- [ ] The 4 `cache_store_setting_test.rb` mem-cache arms become unported `tests:` rows citing `SOLID_STACK_ONLY` (`unported-files/activesupport.ts:8`), and their `BLOCKED:` skips are removed.
- [ ] A unit test pins the scope mapping.

## Verification

```sh
pnpm parity:test --missing --package actionpack  # no mem_cache_store rows
```
