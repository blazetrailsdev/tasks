---
title: "adapters/sqlite3/statement-pool.test.ts: use ambient connection like Rails"
status: closed
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: adapter-test-fidelity
deps: []
deps-rfc: []
est-loc: 50
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Obsolete: statement-pool.test.ts was reduced by RFC 0043 relocation (#4159) to a single it.skip for Rails' fork-based per-pid test, which is unportable; no :memory: sites or connection setup remain to converge."
---

## Context

`adapters/sqlite3/statement-pool.test.ts` hardcodes `:memory:` (8 occurrences).
Rails' `adapters/sqlite3/statement_pool_test.rb` uses **zero** `:memory:` — it
exercises the statement pool over the ambient sqlite3 `arunit` (file-backed)
connection. (Note: `sqlite3_adapter_test.rb` _does_ use `:memory:` heavily and
is left alone — this is the statement-pool test specifically, which does not.)

## Acceptance criteria

- [ ] The statement-pool cases run against the ambient sqlite3 test connection
      instead of private `:memory:` connections, matching
      `adapters/sqlite3/statement_pool_test.rb`.
- [ ] Test names unchanged; pool max-size / eviction / reuse behavior matches
      the Rails test.
- [ ] Runs under the SQLite ARCONN lane (adapter-dir tests); CI green;
      `parity:test` delta non-negative.

## Notes

This file lives under `adapters/sqlite3/**`, which the vitest config runs only
on the SQLite ARCONN lane — verify locally with the sqlite project. Read
`statement_pool_test.rb` first.
</content>
