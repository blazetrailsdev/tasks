---
title: "sqlite-pragma-error-parity"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by assertions-sqlite3-adapter-remainder. `packages/activerecord/src/sqlite/pragmas.ts` diverges from Rails' pragma error behaviour, so four tests in `sqlite3-adapter.test.ts` are `it.skip` with BLOCKED:

- `setBooleanPragma` / enum errors render the bad value with `JSON.stringify` (`":false"` quoted); Rails' test expects `unrecognized pragma parameter :false` (`sqlite3_adapter_test.rb:180-201`).
- `setIntPragma` (`toI`) accepts `false`/`:false` silently; Rails raises `undefined method 'to_i'` (`sqlite3_adapter_test.rb:280-375`), i.e. journal_size_limit, mmap_size, cache_size arms.

## Acceptance criteria

The four skipped tests (overriding default foreign keys / journal size limit / mmap size / cache size pragma) are un-skipped and pass with Rails' regexes unchanged.
