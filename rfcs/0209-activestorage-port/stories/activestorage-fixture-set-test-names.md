---
title: "fixture-set.test.ts titles match Rails' test names"
status: draft
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: ["activestorage"]
deps: []
deps-rfc: []
est-loc: 6
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/fixture_set_test.rb` defines `test_active_storage_blob`, `test_active_storage_attachment` and `test_active_storage_metadata`. parity:test extracts them as "active storage blob", "active storage attachment" and "active storage metadata".

`packages/activestorage/src/fixture-set.test.ts` titles them `it("test_active_storage_blob")` and so on, so all 3 report **missing** (0/3 matched on origin/main `835c4bd7fc`).

## Acceptance criteria

- The three `it` titles are the extracted Rails names: "active storage blob", "active storage attachment" and "active storage metadata".
- `pnpm parity:test -- --package activestorage` shows fixture_set_test.rb at 3/3.
