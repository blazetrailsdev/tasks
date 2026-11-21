---
title: "sqlite3: port test_pragmas.rb's three encoding tests"
status: claimed
updated: 2026-11-21
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-21T03:58:34Z"
assignee: "sqlite3-busy-timeout-pragma-is-unverified-off-better-sqlite3"
blocked-by: null
closed-reason: null
---

## Context

trails#10449 added sqlite3 to test-compare. `test_pragmas.rb` now matches 5 of 8 tests. The three encoding cases are not ported yet:
`vendor/sqlite3/v2.6.0/test/test_pragmas.rb:79-128` (`test_encoding_uppercase`, `test_encoding_lowercase`, `test_encoding_objects`).

They call `Pragmas#encoding` / `#encoding=` (`vendor/sqlite3/v2.6.0/lib/sqlite3/pragmas.rb:225-231`). trails has these as `encoding` / `setEncoding` in `packages/sqlite3/lib/pragmas.ts:253-259`, and also `Database#encoding` (`lib/sqlite3/database.rb`). Ruby `Encoding` objects have no JS value (CLAUDE.md, "A String has no encoding tag either"), so the expected values are encoding names (`"UTF-8"`, `"UTF-16le"` …). Each assertion that depends on a Ruby `Encoding` object needs its own assertion receipt.

## Acceptance criteria

- `packages/sqlite3/test/test-pragmas.test.ts` gets `it("encoding uppercase")`, `it("encoding lowercase")` and `it("encoding objects")`, keeping the Rails names and assertion order.
- `pnpm parity:test --package sqlite3` shows `test_pragmas.rb` at 8/8, with no assertion-kind mismatches.
